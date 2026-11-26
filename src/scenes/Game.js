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
import { ISLAND_01_LAYOUT } from '../world/map-layout/island-01.js';
import { filterTreesToIslandLand } from '../world/filter-trees-to-island-land.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import PlayerStatusUI from '../ui/PlayerStatusUI.js';
import TouchInputController from '../systems/input/TouchInputController.js';
import { SAVE_KEY } from '../config.js';
import { ISLAND_SHAPE } from '../world/IslandShape.js';

const CAMERA_ZOOM = Object.freeze({ max: 2.25, default: 1.2 });
const CAMERA_FOLLOW_LERP = 0.06;
// Teste de escala: ilha circular com 4096 px de diâmetro.
const ISLAND_DIAMETER = 4096;
const ISLAND_RADIUS = ISLAND_DIAMETER / 2;
// O oceano termina a mesma distância da costa em todos os lados.
const OCEAN_MARGIN = 512;
const OCEAN_RADIUS = ISLAND_SHAPE.baseRadius + OCEAN_MARGIN;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.worldObjects = [];
    this.groundObject = null;
    this.terrain = null;
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
    this.createIslandWalkableMask();
    this.depthManager = new WorldDepthManager();
    this.collisionManager = new WorldCollisionManager(this.navigation);
    this.worldObjectManager = new WorldObjectManager(this, {
      depthManager: this.depthManager,
      collisionManager: this.collisionManager
    });
    const landOnlyTreeLayout = filterTreesToIslandLand(ISLAND_01_LAYOUT, this.navigation, this.textures);
    this.removedEdgeTreeIds = ISLAND_01_LAYOUT
      .filter(definition => !landOnlyTreeLayout.includes(definition))
      .map(definition => definition.id);
    this.worldObjects = this.worldObjectManager.create(landOnlyTreeLayout);

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
    // Inicia no maior afastamento que a tela permite, enquadrando toda a
    // área visual do oceano sem barras pretas. O usuário ainda pode aproximar
    // com o gesto de pinça até CAMERA_ZOOM.max.
    this.camera.setBounds(this.oceanBounds.x, this.oceanBounds.y, this.oceanBounds.width, this.oceanBounds.height);
    this.camera.setZoom(this.getMinimumCameraZoom());
    this.clampCameraToWorld();
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
      getMinZoom: () => this.getMinimumCameraZoom(),
      maxZoom: CAMERA_ZOOM.max,
      clampCamera: () => this.clampCameraToWorld(),
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

  getMinimumCameraZoom() {
    const bounds = this.oceanBounds;
    if (!this.camera || !bounds) return 0.08;
    return Math.min(
      CAMERA_ZOOM.max,
      this.camera.width / bounds.width,
      this.camera.height / bounds.height
    );
  }

  clampCameraToWorld() {
    const bounds = this.oceanBounds;
    if (!this.camera || !bounds) return;
    const visibleWidth = this.camera.width / this.camera.zoom;
    const visibleHeight = this.camera.height / this.camera.zoom;
    const maxScrollX = bounds.x + bounds.width - visibleWidth;
    const maxScrollY = bounds.y + bounds.height - visibleHeight;

    this.camera.scrollX = maxScrollX < bounds.x
      ? bounds.x + (bounds.width - visibleWidth) / 2
      : Phaser.Math.Clamp(this.camera.scrollX, bounds.x, maxScrollX);
    this.camera.scrollY = maxScrollY < bounds.y
      ? bounds.y + (bounds.height - visibleHeight) / 2
      : Phaser.Math.Clamp(this.camera.scrollY, bounds.y, maxScrollY);
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
    if (!this.uiCamera || !this.camera) return;
    const width = gameSize?.width || this.scale.width;
    const height = gameSize?.height || this.scale.height;

    // Phaser pode redimensionar o canvas sem atualizar o viewport da câmera
    // principal em alguns ciclos de resize do navegador mobile.
    this.camera.setViewport(0, 0, width, height);
    this.uiCamera.setViewport(0, 0, width, height);

    // A área de oceano acompanha a proporção real da tela, evitando revelar
    // o fundo preto acima/abaixo da textura em telas verticais.
    this.updateOceanBounds(width, height);
    this.camera.setBounds(
      this.oceanBounds.x,
      this.oceanBounds.y,
      this.oceanBounds.width,
      this.oceanBounds.height
    );

    const minZoom = this.getMinimumCameraZoom();
    if (this.camera.zoom < minZoom) this.camera.setZoom(minZoom);
    this.clampCameraToWorld();
  }

  /**
   * Renderiza a ilha com um único Shader Game Object no WebGL.
   * Os três materiais são escolhidos por regiões fixas, não por RNG.
   */
  createGround() {
    const texture = this.textures.get('island-terrain');
    const source = texture?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      throw new Error('A imagem principal da ilha não foi carregada.');
    }

    // Um único Image estático representa todo o terreno; a textura original
    // permanece na resolução WebP e é dimensionada apenas no espaço do mundo.
    this.groundObject = this.add.image(
      this.worldWidth / 2,
      this.worldHeight / 2,
      'island-terrain'
    ).setOrigin(0.5).setDisplaySize(this.worldWidth, this.worldHeight).setDepth(-1000).setActive(false);

    this.terrain = Object.freeze({
      object: this.groundObject,
      mode: 'single-image',
      textureKey: 'island-terrain',
      sourceWidth: source.width,
      sourceHeight: source.height
    });
  }

  createIslandWalkableMask() {
    const source = this.textures.get('island-terrain')?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      throw new Error('Não foi possível gerar a navegação: imagem da ilha indisponível.');
    }

    // Máscara de navegação reduzida: resolução suficiente para a grade de
    // 24 unidades, sem manter uma cópia RGBA de 1254² na memória do jogo.
    const maskSize = Math.min(1024, source.width, source.height);
    const canvas = document.createElement('canvas');
    canvas.width = maskSize;
    canvas.height = maskSize;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Não foi possível criar a máscara alfa da ilha.');

    try {
      context.clearRect(0, 0, maskSize, maskSize);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(source, 0, 0, maskSize, maskSize);
      const pixels = context.getImageData(0, 0, maskSize, maskSize).data;
      this.navigation.setAlphaMask(pixels, maskSize, maskSize, 160);
    } finally {
      // Libera o backing store do canvas após a grade caminhável ser criada.
      canvas.width = 0;
      canvas.height = 0;
    }
  }


  /**
   * Oceano estático contínuo sob a ilha. A área é maior que os limites de
   * câmera permitidos, inclusive no zoom mínimo, para nunca revelar o fundo
   * da página ao arrastar ou afastar a câmera.
   */
  updateOceanBounds(viewWidth, viewHeight) {
    const baseDiameter = OCEAN_RADIUS * 2;
    const aspect = Math.max(0.1, viewWidth / Math.max(1, viewHeight));
    // Preserva ao menos 512 unidades de mar além da costa em todos os lados.
    // A dimensão maior cresce para acompanhar o formato da tela.
    const width = aspect >= 1 ? baseDiameter * aspect : baseDiameter;
    const height = aspect >= 1 ? baseDiameter : baseDiameter / aspect;
    this.oceanBounds = Object.freeze({
      x: ISLAND_SHAPE.centerX - width / 2,
      y: ISLAND_SHAPE.centerY - height / 2,
      width,
      height
    });

    if (this.oceanBackground) {
      this.oceanBackground
        .setPosition(ISLAND_SHAPE.centerX, ISLAND_SHAPE.centerY)
        .setSize(width, height);
    }
  }

  createOceanBackground() {
    const texture = this.textures.get('ocean-pattern');
    if (!texture?.getSourceImage?.()) {
      throw new Error('A textura original do oceano não foi carregada.');
    }

    // O mundo jogável continua em 4096 x 4096. Só a área visual do oceano
    // é expandida para preencher a proporção do viewport, sem bordas pretas.
    this.updateOceanBounds(this.scale.width, this.scale.height);
    this.oceanBackground = this.add.tileSprite(
      ISLAND_SHAPE.centerX,
      ISLAND_SHAPE.centerY,
      this.oceanBounds.width,
      this.oceanBounds.height,
      'ocean-pattern'
    ).setOrigin(0.5).setDepth(-1200);

    this.oceanBackground.setTilePosition(0, 0);
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
