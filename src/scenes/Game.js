import * as Phaser from 'phaser';
import Player from '../entities/Player.js';
import PlayerBodyAdapter from '../entities/PlayerBodyAdapter.js';
import CharacterSpriteRenderer from '../rendering/characters/CharacterSpriteRenderer.js';
import MonsterManager from '../systems/monsters/MonsterManager.js';
import MonsterCombatSystem from '../systems/monsters/MonsterCombatSystem.js';
import { ISLAND_01_MONSTER_SPAWNS } from '../world/spawn-layout/island-01.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ProgressionSystem from '../systems/ProgressionSystem.js';
import PerformanceMonitor from '../ui/PerformanceMonitor.js';
import TouchInputController from '../systems/input/TouchInputController.js';
import { SAVE_KEY } from '../config.js';
import WorldBootstrap from '../world/WorldBootstrap.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.2, max: 0.6, default: 0.4 });
const CAMERA_FOLLOW_LERP = 0.06;
// Teste de escala: ilha circular com 4096 px de diâmetro.

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  async create() {
    this.initialized = false;
    this.savedProgress = this.readSavedProgress();
    this.score = Math.max(0, Number(this.savedProgress.score) || 0);


    this.worldBootstrap = new WorldBootstrap(this);
    const playerSpawn = await this.worldBootstrap.initialize();

    // Logical player state remains independent of its visual renderer.
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
      }
    });

    this.camera = this.cameras.main;
    // Zoom padrão próximo ao enquadramento de referência: o personagem fica
    // legível no celular sem enquadrar a ilha inteira de uma vez.
    // O enquadramento da captura de referência é o limite máximo de
    // aproximação. O zoom inicial usa esse mesmo nível, sem permitir ampliar
    // além da escala mostrada pelo usuário.
    this.camera.setBounds(this.oceanBounds.x, this.oceanBounds.y, this.oceanBounds.width, this.oceanBounds.height);
    this.camera.setZoom(Math.max(this.getMinimumCameraZoom(), CAMERA_ZOOM.default));
    this.clampCameraToWorld();
    // O primeiro enquadramento acompanha o ponto válido onde o jogador nasceu.
    this.camera.startFollow(this.characterRenderer.sprite, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
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
    this.performanceMonitor = new PerformanceMonitor(this);
    this.createHudCamera();
    this.touchInput = new TouchInputController(this, {
      camera: this.camera,
      getMinZoom: () => this.getMinimumCameraZoom(),
      maxZoom: CAMERA_ZOOM.max,
      clampCamera: () => this.clampCameraToWorld(),
      isUiPointer: (x, y) => this.uiScene?.isUiPointer(x, y) || this.performanceMonitor?.containsScreenPoint(x, y) || false,
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
            this.camera.startFollow(this.characterRenderer.sprite, false, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
            this.cameraFollowActive = true;
          }
        } else {
          this.destinationMarker.setVisible(false);
        }
      }
    });

    // Game permanece ativo enquanto a interface é exibida em cena própria.
    this.scene.launch('GameUI');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
    this.initialized = true;
  }

  getMinimumCameraZoom() {
    return CAMERA_ZOOM.min;
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
    // As duas camadas de interface ficam fora da câmera do mundo e são
    // desenhadas somente pela câmera HUD, em escala 1:1.
    this.camera.ignore(this.performanceMonitor.layer);
    this.uiCamera.ignore(this.children.list.filter(child => child !== this.performanceMonitor.layer));
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
    this.worldBootstrap.updateOceanBounds(width, height);
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
    if (!this.initialized) return;
    const updateStartedAt = performance.now();
    if (!this.player?.alive) {
      this.movement?.clearDestination();
      if (this.characterRenderer?.activeAction !== 'dying') this.characterRenderer?.playAction('dying');
    }
    this.movement?.setPaused(!this.player?.alive);
    this.combat?.update(this.time.now);
    this.movement?.update(delta);
    this.player?.update(delta, this.time.now);
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
    this.performanceMonitor?.update(delta, performance.now() - updateStartedAt, this.monsterManager?.metrics);
    // O renderer do personagem e os objetos do cenário usam a mesma escala de profundidade.
  }

  showLevelUpNotice(level) {
    const n = this.add.text(this.scale.width/2,this.scale.height*.22,'NÍVEL '+level+'!',{fontSize:'28px',color:'#fde68a',fontStyle:'bold',stroke:'#422006',strokeThickness:5}).setOrigin(.5).setScrollFactor(0).setDepth(1250);
    this.tweens.add({targets:n,y:n.y-34,alpha:0,duration:1800,onComplete:()=>n.destroy()});
  }

  shutdown() {
    if (this.player) this.persistProgress({ score: this.score, player: this.player.toSaveData() });
    this.scale.off('resize', this.resizeHudCamera, this);
    this.performanceMonitor?.destroy();
    this.performanceMonitor = null;
    if (this.scene.isActive('GameUI')) this.scene.stop('GameUI');
    if (this.uiCamera) this.cameras.remove(this.uiCamera);
    this.uiCamera = null;
    this.touchInput?.destroy();
    this.combat?.destroy();
    this.monsterCombat?.destroy();
    this.movement?.destroy();
    this.monsterManager?.destroy();
    this.playerBody?.destroy();
    this.characterRenderer?.destroy();
    this.worldBootstrap?.destroy();
    this.worldBootstrap = null;
    this.touchInput = null;
    this.movement = null;
    this.playerBody = null;
    this.characterRenderer = null;
    this.player = null;
    this.progression = null;
    this.uiScene = null;
    this.monsterManager = null;
  }
}
