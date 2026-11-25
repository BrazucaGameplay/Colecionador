import Phaser from 'phaser';
import Player from '../entities/Player.js';
import PlayerBodyAdapter from '../entities/PlayerBodyAdapter.js';
import CharacterRenderer3D from '../rendering/characters/CharacterRenderer3D.js';
import { DEFAULT_PLAYER_SKIN_ID, PLAYER_SKINS, getPlayerSkin } from '../rendering/characters/CharacterAssets.js';
import Monster from '../entities/Monster.js';
import WorldNavigation from '../world/WorldNavigation.js';
import MovementSystem from '../systems/MovementSystem.js';
import TouchInputController from '../systems/input/TouchInputController.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.28, max: 2.25, default: 1.2 });
const GENERATED_GROUND_TEXTURE = 'island-01-ground-generated';
// Teste de escala: ilha circular com 4096 px de diâmetro.
const ISLAND_DIAMETER = 4096;
const ISLAND_RADIUS = ISLAND_DIAMETER / 2;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.worldObjects = [];
    this.groundTiles = [];
  }

  create() {
    this.savedProgress = this.readSavedProgress();
    this.score = Math.max(0, Number(this.savedProgress.score) || 0);
    const initialSkinId = getPlayerSkin(this.savedProgress.skinId || DEFAULT_PLAYER_SKIN_ID).id;

    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    this.worldWidth = ISLAND_DIAMETER;
    this.worldHeight = ISLAND_DIAMETER;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.navigation = new WorldNavigation(this.worldWidth, this.worldHeight);
    this.createCloudBoundary();
    this.createGround();
    this.createIslandWalkableMask();
    this.createTrees();

    const playerSpawn = this.navigation.findNearestWalkablePoint(centerX, centerY);
    if (!playerSpawn) {
      throw new Error('Não foi encontrado um ponto caminhável para iniciar o jogador.');
    }

    // Logical player state exists independently of the GLB and all renderers.
    this.player = new Player({ x: playerSpawn.x, y: playerSpawn.y, speed: 220, maxHealth: 3 });
    this.playerBody = new PlayerBodyAdapter(this, this.player);
    this.weaponStatusText = this.add.text(16, 68, 'Espada: aguardando personagem', {
      fontSize: '11px',
      color: '#fff2b2',
      stroke: '#172719',
      strokeThickness: 3,
      wordWrap: { width: Math.max(180, viewWidth - 32) }
    }).setScrollFactor(0).setDepth(1001);
    this.characterRenderer = new CharacterRenderer3D(this.game.canvas.parentElement, {
      skinId: initialSkinId,
      onError: (message) => console.warn('[CharacterRenderer]', message),
      onSkinChanged: (skin) => console.info('[CharacterSkin] equipada:', skin.name),
      onWeaponStatus: ({ status, details }) => {
        const detail = details?.message ? ` — ${details.message}` : '';
        this.weaponStatusText?.setText(`Espada: ${status}${detail}`);
        console.info('[WeaponDiagnostic]', status, details);
      }
    });

    const monsterSpawn = this.navigation.findNearestWalkablePoint(centerX - 180, centerY - 105);
    const enemySpawn = monsterSpawn || { x: playerSpawn.x + 90, y: playerSpawn.y };
    this.monster = new Monster(this, enemySpawn.x, enemySpawn.y);
    this.physics.add.overlap(
      this.playerBody.object,
      this.monster.sprite,
      () => this.hitMonster()
    );

    this.hpText = this.add.text(16, 16, 'HP ' + this.player.health, {
      fontSize: '20px',
      color: '#fff',
      stroke: '#172719',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(1000);

    this.scoreText = this.add.text(16, 44, 'Monstros: ' + this.score, {
      fontSize: '18px',
      color: '#fff',
      stroke: '#172719',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(1000);

    this.camera = this.cameras.main;
    // Zoom padrão próximo ao enquadramento de referência: o personagem fica
    // legível no celular sem enquadrar a ilha inteira de uma vez.
    // Zoom fixo de referência: mantém o enquadramento próximo ao screenshot
    // enviado pelo usuário em telas mobile, sem reduzir automaticamente em telas estreitas.
    this.camera.setZoom(CAMERA_ZOOM.default);

    const viewportWorldWidth = this.camera.width / this.camera.zoom;
    const viewportWorldHeight = this.camera.height / this.camera.zoom;
    const panMarginX = Math.max(160, viewportWorldWidth);
    const panMarginY = Math.max(160, viewportWorldHeight);
    this.camera.setBounds(
      -panMarginX,
      -panMarginY,
      this.worldWidth + panMarginX * 2,
      this.worldHeight + panMarginY * 2
    );
    // O primeiro enquadramento acompanha o ponto válido onde o jogador nasceu.
    this.camera.centerOn(playerSpawn.x, playerSpawn.y);

    this.destinationMarker = this.add.circle(0, 0, 12, 0xfacc15, 0.18)
      .setStrokeStyle(2, 0xfacc15, 0.95)
      .setDepth(900)
      .setVisible(false);

    this.movement = new MovementSystem(this.player, this.navigation);
    this.touchInput = new TouchInputController(this, {
      camera: this.camera,
      onTap: (screenX, screenY) => {
        const target = this.camera.getWorldPoint(screenX, screenY);
        const accepted = this.movement.setDestination(target.x, target.y);
        if (accepted) {
          const destination = this.movement.destination;
          this.destinationMarker.setPosition(destination.x, destination.y).setVisible(true);
        } else {
          this.destinationMarker.setVisible(false);
        }
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
  }

  /**
   * Repete a única textura de grama e recorta o resultado pela transparência
   * de uma máscara circular. A dimensão do mundo e a navegação usam o mesmo raio.
   */
  createGround() {
    const tileSource = this.textures.get('island-ground-tile').getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = this.worldWidth;
    canvas.height = this.worldHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Não foi possível preparar a textura repetida do terreno.');
    }

    const pattern = context.createPattern(tileSource, 'repeat');
    if (!pattern) {
      throw new Error('Não foi possível criar o padrão repetido de grama.');
    }

    // Recorta a textura repetida em um círculo perfeito, sem esticar o tile.
    context.save();
    context.beginPath();
    context.arc(ISLAND_RADIUS, ISLAND_RADIUS, ISLAND_RADIUS - 2, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = pattern;
    context.fillRect(0, 0, this.worldWidth, this.worldHeight);
    context.restore();

    if (this.textures.exists(GENERATED_GROUND_TEXTURE)) {
      this.textures.remove(GENERATED_GROUND_TEXTURE);
    }
    this.textures.addCanvas(GENERATED_GROUND_TEXTURE, canvas);

    const ground = this.add.image(
      this.worldWidth / 2,
      this.worldHeight / 2,
      GENERATED_GROUND_TEXTURE
    ).setOrigin(0.5, 0.5).setDepth(-1000);

    this.groundTiles.push(ground);
  }

  createIslandWalkableMask() {
    this.navigation.setCircleMask(ISLAND_RADIUS, ISLAND_RADIUS, ISLAND_RADIUS - 28);
  }


  /**
   * Árvores distribuídas pela ilha. A altura visual fica cerca de 1,5x
   * a altura-base do protagonista (76 unidades), com centro inicial livre.
   */
  createTrees() {
    const treeKeys = ['tree-large', 'tree-flowering'];
    const totalTrees = 34;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < totalTrees; i++) {
      const angle = i * goldenAngle;
      const radius = i < 10
        ? 300 + (i % 5) * 48
        : 650 + ((i - 10) / (totalTrees - 10)) * 1120;
      const x = ISLAND_RADIUS + Math.cos(angle) * radius;
      const y = ISLAND_RADIUS + Math.sin(angle) * radius;

      if (!this.navigation.isAreaWalkable(x, y, 54)) continue;

      const key = treeKeys[i % treeKeys.length];
      const tree = this.add.image(x, y, key)
        .setOrigin(0.5, 1)
        .setDepth(y + 35)
        .setData('depthOffset', 35);

      const source = this.textures.get(key).getSourceImage();
      const targetHeight = 112 + (i % 3) * 5;
      tree.setScale(targetHeight / source.height);

      // Colisão pequena no tronco, não na copa.
      this.navigation.addObstacle(x, y - 12, 17, 13);
      this.worldObjects.push(tree);
    }
  }


  /**
   * Borda decorativa em camadas: cascatas no limite externo e relevo
   * ligeiramente para dentro. A máscara circular continua sendo a regra
   * de caminhada, portanto os elementos de borda não ampliam a área jogável.
   */
  /**
   * Nuvens formam uma faixa contínua fora do contorno circular.
   * A camada fica atrás do terreno: a grama recorta naturalmente a parte
   * interna das nuvens, sem cobrir a área caminhável nem exigir PNG externo.
   */
  createCloudBoundary() {
    const key = 'generated-cloud-bank';
    const width = 512;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar a textura das nuvens.');

    const puffs = [
      [65, 164, 74, 54], [130, 128, 90, 82], [218, 150, 104, 78],
      [310, 132, 92, 88], [398, 164, 86, 62], [462, 184, 58, 44],
      [172, 198, 116, 42], [300, 202, 126, 40]
    ];
    for (const [x, y, rx, ry] of puffs) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      const gradient = ctx.createRadialGradient(0, -rx * 0.18, rx * 0.08, 0, 0, rx);
      gradient.addColorStop(0, 'rgba(255,255,255,0.98)');
      gradient.addColorStop(0.48, 'rgba(235,246,255,0.96)');
      gradient.addColorStop(0.78, 'rgba(190,216,240,0.88)');
      gradient.addColorStop(1, 'rgba(150,190,225,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sombra azul suave na base para dar volume sem parecer fumaça escura.
    const base = ctx.createLinearGradient(0, 170, 0, 256);
    base.addColorStop(0, 'rgba(190,218,244,0)');
    base.addColorStop(1, 'rgba(125,169,210,0.58)');
    ctx.fillStyle = base;
    ctx.fillRect(0, 170, width, 86);

    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);

    const count = 48;
    const ringRadius = ISLAND_RADIUS + 155;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const variation = 0.88 + ((i * 17) % 9) * 0.035;
      const x = ISLAND_RADIUS + Math.cos(angle) * ringRadius;
      const y = ISLAND_RADIUS + Math.sin(angle) * ringRadius;
      const cloud = this.add.image(x, y, key)
        .setOrigin(0.5, 0.5)
        .setRotation(angle + Math.PI / 2)
        .setScale(variation)
        .setDepth(-1100);
      cloud.setAlpha(0.94);
    }
  }


  readSavedProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (error) {
      console.warn('Save inválido; usando progresso inicial.', error);
      return {};
    }
  }

  persistProgress(patch = {}) {
    this.savedProgress = {
      ...(this.savedProgress || {}),
      ...patch,
      at: Date.now()
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.savedProgress));
      return true;
    } catch (error) {
      console.warn('Não foi possível salvar o progresso neste dispositivo.', error);
      return false;
    }
  }

  /** Troca apenas a aparência; Player, física, navegação e posição permanecem intactos. */
  async equipPlayerSkin(skinId) {
    const skin = Object.values(PLAYER_SKINS).find((entry) => entry.id === skinId);
    if (!skin || !this.characterRenderer) return false;

    const equipped = await this.characterRenderer.setSkin(skin.id);
    if (!equipped) return false;

    this.persistProgress({ skinId: skin.id });
    return true;
  }

  hitMonster() {
    if (this._cooldown > this.time.now || this.monster.dead || !this.player.alive) return;
    this._cooldown = this.time.now + 500;
    this.characterRenderer?.playSlash();
    this.monster.takeHit();

    if (this.monster.dead) {
      this.score += 1;
      this.scoreText.setText('Monstros: ' + this.score);
      this.persistProgress({ score: this.score });
      this.time.delayedCall(600, () => {
        if (!this.monster || !this.monster.scene) return;
        this.monster.respawn();
      });
    }
  }

  update(time, delta = 16.67) {
    this.movement?.update(delta);
    this.playerBody?.sync();

    this.characterRenderer?.setTransform(this.player.x, this.player.y);
    this.characterRenderer?.setMoving(this.player.moving);
    if (this.player.moving) {
      this.characterRenderer?.setDirection(this.player.facing.x, this.player.facing.y);
    }
    this.characterRenderer?.update(delta, this.camera);

    if (!this.movement?.destination) this.destinationMarker?.setVisible(false);

    this.monster?.update(this.time.now);
    if (this.monster && !this.monster.dead) {
      const seconds = Math.min(Math.max(delta, 0), 50) / 1000;
      const nextX = this.monster.sprite.x + this.monster.sprite.body.velocity.x * seconds;
      const nextY = this.monster.sprite.y + this.monster.sprite.body.velocity.y * seconds;
      if (!this.navigation.isAreaWalkable(nextX, nextY, 12)) {
        this.monster.sprite.setVelocity(0, 0);
      }
      this.monster.sprite.setDepth(this.monster.sprite.y + 20);
    }
    this.playerBody?.object.setDepth(this.player.y + 20);
    for (const object of this.worldObjects) {
      object.setDepth(object.y + (object.getData('depthOffset') || 0));
    }
  }

  shutdown() {
    this.touchInput?.destroy();
    this.movement?.destroy();
    this.playerBody?.destroy();
    this.characterRenderer?.destroy();
    this.monster?.destroy();
    this.worldObjects.length = 0;
    this.groundTiles.length = 0;
    this.touchInput = null;
    this.movement = null;
    this.playerBody = null;
    this.characterRenderer = null;
    this.player = null;
    this.monster = null;
  }
}
