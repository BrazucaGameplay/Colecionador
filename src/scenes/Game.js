import * as Phaser from 'phaser';
import Player from '../entities/Player.js';
import PlayerBodyAdapter from '../entities/PlayerBodyAdapter.js';
import CharacterSpriteRenderer from '../rendering/characters/CharacterSpriteRenderer.js';
import MonsterManager from '../systems/monsters/MonsterManager.js';
import MonsterCombatSystem from '../systems/monsters/MonsterCombatSystem.js';
import { ISLAND_01_MONSTER_SPAWNS } from '../world/spawn-layout/island-01.js';
import WorldNavigation from '../world/WorldNavigation.js';
import WorldDepthManager from '../world/WorldDepthManager.js';
import WorldCollisionManager from '../world/WorldCollisionManager.js';
import WorldObjectManager from '../world/WorldObjectManager.js';
import { createIslandTerrain } from '../world/IslandTerrainRenderer.js';
import { ISLAND_SHAPE } from '../world/IslandShape.js';
import { ISLAND_01_LAYOUT } from '../world/map-layout/island-01.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import PlayerStatusUI from '../ui/PlayerStatusUI.js';
import TouchInputController from '../systems/input/TouchInputController.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.08, max: 2.25, default: 1.2 });
const CAMERA_FOLLOW_LERP = 0.06;
// Teste de escala: ilha circular com 4096 px de diâmetro.
const ISLAND_DIAMETER = 4096;
const ISLAND_RADIUS = ISLAND_DIAMETER / 2;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.worldObjects = [];
    this.groundObject = null;
    this.terrain = null;
    this.shorelineOverlays = [];
  }

  create() {
    this.savedProgress = this.readSavedProgress();
    this.score = Math.max(0, Number(this.savedProgress.score) || 0);


    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    this.worldWidth = ISLAND_DIAMETER;
    this.worldHeight = ISLAND_DIAMETER;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.navigation = new WorldNavigation(this.worldWidth, this.worldHeight);
    this.createOceanBackground();
    this.createGround();
    this.createShorelineOverlays();
    this.createIslandWalkableMask();
    this.depthManager = new WorldDepthManager();
    this.collisionManager = new WorldCollisionManager(this.navigation);
    this.worldObjectManager = new WorldObjectManager(this, {
      depthManager: this.depthManager,
      collisionManager: this.collisionManager
    });
    this.worldObjects = this.worldObjectManager.create(ISLAND_01_LAYOUT);

    const playerSpawn = this.navigation.findNearestWalkablePoint(centerX, centerY);
    if (!playerSpawn) {
      throw new Error('Não foi encontrado um ponto caminhável para iniciar o jogador.');
    }

    // Logical player state exists independently of the GLB and all renderers.
    this.player = new Player({ x: playerSpawn.x, y: playerSpawn.y, speed: 220, saveData: this.savedProgress.player });
    this.progression = new ProgressionSystem({ statPointsPerLevel: 3, onLevelUp: ({ level }) => this.showLevelUpNotice(level) });
    this.playerBody = new PlayerBodyAdapter(this, this.player);
    this.characterRenderer = new CharacterSpriteRenderer(this, {
      x: playerSpawn.x,
      y: playerSpawn.y,
      depthManager: this.depthManager
    });

    this.monsterManager = new MonsterManager(this, {
      navigation: this.navigation,
      playerBody: this.playerBody,
      depthManager: this.depthManager,
      spawnZones: ISLAND_01_MONSTER_SPAWNS,
      onKill: ({ experience = 0 } = {}) => {
        this.score += 1;
        this.progression.award(this.player, experience);
        this.persistProgress({ score: this.score, player: this.player.toSaveData() });
        this.statusUI?.refresh();
      }
    });

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
    this.camera.startFollow(this.playerBody.object, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    this.cameraFollowActive = true;

    this.destinationMarker = this.add.circle(0, 0, 12, 0xfacc15, 0.18)
      .setStrokeStyle(2, 0xfacc15, 0.95)
      .setDepth(900)
      .setVisible(false);

    this.movement = new MovementSystem(this.player, this.navigation);
    this.combat = new CombatSystem({
      player: this.player,
      movement: this.movement,
      getTargets: () => this.monsterManager?.getAliveEntities() || [],
      onAttack: (target, damage, now, penetration, attackIntervalMs) => {
        this.characterRenderer?.playAction('combat', { durationMs: attackIntervalMs });
        this.monsterManager?.damage(target.id, damage, now, penetration);
      }
    });
    this.monsterCombat = new MonsterCombatSystem({
      player: this.player,
      getAttackers: () => this.monsterManager?.getCombatEntries() || []
    });
    this.statusUI = new PlayerStatusUI(this, this.player, this.progression, {
      onChange: () => this.persistProgress({ score: this.score, player: this.player.toSaveData() })
    });
    this.createHudCamera();
    this.touchInput = new TouchInputController(this, {
      camera: this.camera,
      isUiPointer: (x, y) => this.statusUI?.isUiPointer(x, y) || false,
      onPan: () => {
        // O controlador já interrompeu o follow ao iniciar o arraste.
        this.cameraFollowActive = false;
      },
      onTap: (screenX, screenY) => {
        const target = this.camera.getWorldPoint(screenX, screenY);
        const accepted = this.movement.setDestination(target.x, target.y);
        if (accepted) {
          const destination = this.movement.destination;
          this.destinationMarker.setPosition(destination.x, destination.y).setVisible(true);
          // Só reativa o follow após exploração manual. Não reinicia o
          // interpolador em toques sucessivos enquanto a câmera já acompanha.
          if (!this.cameraFollowActive) {
            this.camera.startFollow(this.playerBody.object, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
            this.cameraFollowActive = true;
          }
        } else {
          this.destinationMarker.setVisible(false);
        }
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
  }

  createHudCamera() {
    // A HUD é renderizada por uma segunda câmera sem zoom nem scroll do mundo.
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false);
    this.uiCamera.setZoom(1).setScroll(0, 0);
    this.uiCamera.roundPixels = true;
    this.camera.ignore(this.statusUI.uiLayer);
    this.uiCamera.ignore(this.children.list.filter(child => child !== this.statusUI.uiLayer));
    this.scale.on('resize', this.resizeHudCamera, this);
  }

  resizeHudCamera(gameSize) {
    if (!this.uiCamera) return;
    const width = gameSize?.width || this.scale.width;
    const height = gameSize?.height || this.scale.height;
    this.uiCamera.setViewport(0, 0, width, height);
  }

  /**
   * Renderiza a ilha com um único Shader Game Object no WebGL.
   * Os três materiais são escolhidos por regiões fixas, não por RNG.
   */
  createGround() {
    this.terrain = createIslandTerrain(this, {
      diameter: this.worldWidth,
      smoothKey: 'terrain-smooth',
      grassKey: 'terrain-grass',
      reliefKey: 'terrain-relief'
    });
    this.groundObject = this.terrain.object;
  }

  createShorelineOverlays() {
    // Cinco recortes de margem formam uma camada visual acima do terreno.
    // Cada peça atravessa a linha circular: metade fica sobre a ilha e metade
    // avança sobre o oceano. A sobreposição entre peças evita frestas visíveis.
    const keys = ['shore-overlay-0','shore-overlay-2','shore-overlay-3','shore-overlay-4','shore-overlay-5'];
    const count = 25;
    const radius = ISLAND_SHAPE.baseRadius;
    const pieceSize = 620;
    const angleOffset = -Math.PI / 2;
    this.shorelineOverlays = [];
    for (let index = 0; index < count; index++) {
      const angle = angleOffset + (index / count) * Math.PI * 2;
      const key = keys[index % keys.length];
      const x = ISLAND_SHAPE.centerX + Math.cos(angle) * radius;
      const y = ISLAND_SHAPE.centerY + Math.sin(angle) * radius;
      const overlay = this.add.image(x, y, key)
        .setDisplaySize(pieceSize, pieceSize)
        .setOrigin(0.5, 0.5)
        .setRotation(angle + Math.PI / 2)
        .setDepth(-950);
      this.shorelineOverlays.push(overlay);
    }
  }

  createIslandWalkableMask() {
    this.navigation.setIslandMask(ISLAND_SHAPE.centerX, ISLAND_SHAPE.centerY, ISLAND_SHAPE);
  }


  /**
   * Oceano estático contínuo sob a ilha. A área é maior que os limites de
   * câmera permitidos, inclusive no zoom mínimo, para nunca revelar o fundo
   * da página ao arrastar ou afastar a câmera.
   */
  createOceanBackground() {
    // TileSprite limitado a camera; as bordas sao fundidas sem espelhar as ondas.
    const source = this.textures.get('ocean-pattern').getSourceImage();
    const width = source.width;
    const height = source.height;
    const seamlessKey = 'ocean-pattern-seamless';
    if (!this.textures.exists(seamlessKey)) {
      const texture = this.textures.createCanvas(seamlessKey, width, height);
      const context = texture.getContext();
      context.drawImage(source, 0, 0, width, height);
      const original = context.getImageData(0, 0, width, height).data;
      const horizontal = new Uint8ClampedArray(original);
      const output = new Uint8ClampedArray(original);
      const band = Math.max(10, Math.round(Math.min(width, height) * 0.055));
      const smooth = value => {
        const t = Math.max(0, Math.min(1, value));
        return t * t * (3 - 2 * t);
      };

      // Mistura cada borda com sua oposta na mesma coordenada da onda.
      // A influencia diminui suavemente antes de chegar ao interior da imagem.
      for (let y = 0; y < height; y++) {
        const left = y * width * 4;
        const right = (y * width + width - 1) * 4;
        for (let x = 0; x < width; x++) {
          const distance = Math.min(x, width - 1 - x);
          const amount = 1 - smooth(distance / band);
          if (amount <= 0) continue;
          const index = (y * width + x) * 4;
          for (let channel = 0; channel < 4; channel++) {
            const seam = (original[left + channel] + original[right + channel]) * 0.5;
            horizontal[index + channel] = original[index + channel] * (1 - amount) + seam * amount;
          }
        }
      }

      // Repete a fusao no eixo vertical, incluindo os quatro cantos.
      for (let y = 0; y < height; y++) {
        const distance = Math.min(y, height - 1 - y);
        const amount = 1 - smooth(distance / band);
        if (amount <= 0) continue;
        for (let x = 0; x < width; x++) {
          const top = x * 4;
          const bottom = ((height - 1) * width + x) * 4;
          const index = (y * width + x) * 4;
          for (let channel = 0; channel < 4; channel++) {
            const seam = (horizontal[top + channel] + horizontal[bottom + channel]) * 0.5;
            output[index + channel] = horizontal[index + channel] * (1 - amount) + seam * amount;
          }
        }
      }

      // Os quatro pixels de canto compartilham a mesma cor de encontro.
      const corners = [0, (width - 1) * 4, (height - 1) * width * 4, (height * width - 1) * 4];
      for (let channel = 0; channel < 4; channel++) {
        const average = corners.reduce((sum, index) => sum + output[index + channel], 0) / 4;
        for (const index of corners) output[index + channel] = average;
      }
      context.putImageData(new ImageData(output, width, height), 0, 0);
      texture.refresh();
    }

    const view = this.cameras.main.worldView;
    this.oceanBackground = this.add.tileSprite(
      view.centerX, view.centerY, view.width, view.height, seamlessKey
    ).setOrigin(0.5).setDepth(-1200);
    this.oceanBackground.setTilePosition(view.x, view.y);
  }
  syncOceanBackground() {
    if (!this.oceanBackground || !this.camera) return;
    const view = this.camera.worldView;
    this.oceanBackground.setPosition(view.centerX, view.centerY);
    this.oceanBackground.setSize(view.width, view.height);
    this.oceanBackground.setTilePosition(view.x, view.y);
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


  update(time, delta = 16.67) {
    if (!this.player?.alive) {
      this.movement?.clearDestination();
      if (this.characterRenderer?.activeAction !== 'dying') this.characterRenderer?.playAction('dying');
    }
    this.movement?.setPaused(!this.player?.alive);
    this.syncOceanBackground();
    this.combat?.update(this.time.now);
    this.movement?.update(delta);
    this.player?.update(delta, this.time.now);
    this.statusUI?.refresh();
    this.playerBody?.sync();

    this.characterRenderer?.setTransform(this.player.x, this.player.y);
    this.characterRenderer?.setMoving(this.player.moving);
    if (this.player.moving) {
      this.characterRenderer?.setDirection(this.player.facing.x, this.player.facing.y);
    }
    this.characterRenderer?.update(delta, this.camera);

    if (!this.movement?.destination) this.destinationMarker?.setVisible(false);

    this.monsterManager?.update(this.time.now, delta);
    this.monsterCombat?.update(this.time.now);
    // O renderer do personagem e os objetos do cenário usam a mesma escala de profundidade.
  }

  showLevelUpNotice(level) {
    const n = this.add.text(this.scale.width/2,this.scale.height*.22,'NÍVEL '+level+'!',{fontSize:'28px',color:'#fde68a',fontStyle:'bold',stroke:'#422006',strokeThickness:5}).setOrigin(.5).setScrollFactor(0).setDepth(1250);
    this.tweens.add({targets:n,y:n.y-34,alpha:0,duration:1800,onComplete:()=>n.destroy()});
  }

  shutdown() {
    if (this.player) this.persistProgress({ score: this.score, player: this.player.toSaveData() });
    this.scale.off('resize', this.resizeHudCamera, this);
    this.statusUI?.destroy();
    if (this.uiCamera) this.cameras.remove(this.uiCamera);
    this.uiCamera = null;
    this.touchInput?.destroy();
    this.combat?.destroy();
    this.monsterCombat?.destroy();
    this.movement?.destroy();
    this.monsterManager?.destroy();
    this.playerBody?.destroy();
    this.characterRenderer?.destroy();
    this.worldObjectManager?.destroy();
    this.collisionManager?.destroy();
    this.worldObjects.length = 0;
    this.shorelineOverlays?.forEach(overlay => overlay.destroy());
    this.shorelineOverlays = [];
    this.groundObject?.destroy();
    this.groundObject = null;
    this.terrain = null;
    this.oceanBackground?.destroy();
    this.oceanBackground = null;
    this.touchInput = null;
    this.movement = null;
    this.playerBody = null;
    this.characterRenderer = null;
    this.worldObjectManager = null;
    this.collisionManager = null;
    this.depthManager = null;
    this.player = null;
    this.progression = null;
    this.statusUI = null;
    this.monsterManager = null;
  }
}
