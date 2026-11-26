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
import { createTerrainLayers, syncTerrainLayersToCamera } from '../world/TerrainComposer.js';
import { ISLAND_01_LAYOUT } from '../world/map-layout/island-01.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import PlayerStatusUI from '../ui/PlayerStatusUI.js';
import TouchInputController from '../systems/input/TouchInputController.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.28, max: 2.25, default: 1.2 });
const CAMERA_FOLLOW_LERP = 0.06;
// Teste de escala: ilha circular com 4096 px de diâmetro.
const ISLAND_DIAMETER = 4096;
const ISLAND_RADIUS = ISLAND_DIAMETER / 2;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.worldObjects = [];
    this.groundTiles = [];
    this.groundMasks = [];
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
    this.createCloudBoundary();
    this.createGround();
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
   * Monta o terreno diretamente com TileSprites e máscaras geométricas.
   * Nenhuma textura/canvas do tamanho total da ilha é gerada.
   */
  createGround() {
    const terrain = createTerrainLayers(this, {
      diameter: this.worldWidth,
      smoothKey: 'terrain-smooth',
      grassKey: 'terrain-grass',
      reliefKey: 'terrain-relief',
      cellSize: 64
    });
    this.groundTiles = this.cloudFieldTile ? [this.cloudFieldTile, ...terrain.tiles] : terrain.tiles;
    this.groundMasks = terrain.masks;
    this.terrainDistribution = terrain.distribution;
  }

  createIslandWalkableMask() {
    this.navigation.setCircleMask(ISLAND_RADIUS, ISLAND_RADIUS, ISLAND_RADIUS - 28);
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
    const textureKey = 'generated-cloud-sea';
    const bankKey = 'generated-cloud-bank';
    const size = 512;

    // Campo de nuvens opaco que preenche toda a área externa visível.
    const fieldCanvas = document.createElement('canvas');
    fieldCanvas.width = size;
    fieldCanvas.height = size;
    const field = fieldCanvas.getContext('2d');
    if (!field) throw new Error('Não foi possível criar o campo de nuvens.');

    const sky = field.createLinearGradient(0, 0, size, size);
    sky.addColorStop(0, '#a9cbea');
    sky.addColorStop(0.5, '#c7def3');
    sky.addColorStop(1, '#8fb8df');
    field.fillStyle = sky;
    field.fillRect(0, 0, size, size);

    // Nuvens densas em posições determinísticas para repetir sem cintilação.
    for (let i = 0; i < 64; i++) {
      const x = (i * 137.5 + (i % 4) * 31) % size;
      const y = (i * 83.7 + (i % 7) * 19) % size;
      const radius = 32 + (i % 5) * 9;
      const puff = field.createRadialGradient(x - radius * 0.18, y - radius * 0.28, radius * 0.08, x, y, radius);
      puff.addColorStop(0, 'rgba(255,255,255,0.99)');
      puff.addColorStop(0.55, 'rgba(244,250,255,0.96)');
      puff.addColorStop(0.84, 'rgba(219,235,250,0.9)');
      puff.addColorStop(1, 'rgba(193,220,244,0)');
      field.fillStyle = puff;
      field.beginPath();
      field.arc(x, y, radius, 0, Math.PI * 2);
      field.fill();
    }

    if (this.textures.exists(textureKey)) this.textures.remove(textureKey);
    this.textures.addCanvas(textureKey, fieldCanvas);
    this.cloudFieldTile = this.add.tileSprite(ISLAND_RADIUS, ISLAND_RADIUS, this.scale.width, this.scale.height, textureKey)
      .setOrigin(0.5).setDepth(-1200);

    // Faixa volumosa em primeiro plano, avançando sobre a grama.
    const bankCanvas = document.createElement('canvas');
    bankCanvas.width = size;
    bankCanvas.height = 256;
    const ctx = bankCanvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar a borda de nuvens.');

    const puffs = [[35,150,58],[95,118,76],[165,145,82],[245,116,78],[325,145,84],[405,120,76],[475,158,62],[135,195,92],[275,195,100],[410,195,90]];
    for (const [x, y, radius] of puffs) {
      const puff = ctx.createRadialGradient(x-radius*0.2,y-radius*0.3,radius*0.06,x,y,radius);
      puff.addColorStop(0,'rgba(255,255,255,1)');
      puff.addColorStop(0.48,'rgba(244,250,255,0.99)');
      puff.addColorStop(0.76,'rgba(211,231,249,0.94)');
      puff.addColorStop(1,'rgba(165,202,235,0)');
      ctx.fillStyle=puff;
      ctx.beginPath();
      ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.fill();
    }
    if (this.textures.exists(bankKey)) this.textures.remove(bankKey);
    this.textures.addCanvas(bankKey, bankCanvas);

    const count = 48;
    const ringRadius = ISLAND_RADIUS - 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count;
      const scale = 0.98 + ((i * 13) % 5) * 0.045;
      const x = ISLAND_RADIUS + Math.cos(angle) * ringRadius;
      const y = ISLAND_RADIUS + Math.sin(angle) * ringRadius;
      this.add.image(x, y, bankKey)
        .setOrigin(0.5)
        .setRotation(angle + Math.PI / 2)
        .setScale(scale)
        .setAlpha(0.98)
        .setDepth(-900);
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


  update(time, delta = 16.67) {
    if (!this.player?.alive) {
      this.movement?.clearDestination();
      if (this.characterRenderer?.activeAction !== 'dying') this.characterRenderer?.playAction('dying');
    }
    this.movement?.setPaused(!this.player?.alive);
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
    if (this.camera && this.groundTiles.length) syncTerrainLayersToCamera(this.groundTiles, this.camera);
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
    for (const object of this.groundTiles) object.destroy();
    for (const mask of this.groundMasks) mask.destroy();
    this.groundTiles.length = 0;
    this.groundMasks.length = 0;
    this.cloudFieldTile = null;
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
