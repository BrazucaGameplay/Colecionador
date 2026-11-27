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
import CameraController from '../systems/camera/CameraController.js';
import SaveManager from '../systems/persistence/SaveManager.js';

// Teste de escala: ilha circular com 4096 px de diâmetro.

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  async create() {
    this.initialized = false;
    this.saveManager = new SaveManager({ key: SAVE_KEY });
    this.savedProgress = this.saveManager.load();
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
        this.saveManager.save({ score: this.score, player: this.player.toSaveData() });
      }
    });

    this.cameraController = new CameraController(this);
    this.camera = this.cameraController.initialize(this.characterRenderer.sprite);

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
    this.cameraController.createHudCamera(this.performanceMonitor.layer);
    this.touchInput = new TouchInputController(this, {
      camera: this.camera,
      getMinZoom: () => this.cameraController.getMinimumZoom(),
      maxZoom: this.cameraController.getMaximumZoom(),
      clampCamera: () => this.cameraController.clampToWorld(),
      isUiPointer: (x, y) => this.uiScene?.isUiPointer(x, y) || this.performanceMonitor?.containsScreenPoint(x, y) || false,
      onPan: () => this.cameraController.handleManualPan(),
      onTap: (screenX, screenY) => {
        const target = this.camera.getWorldPoint(screenX, screenY);
        const accepted = this.movement.setDestination(target.x, target.y);
        if (accepted) {
          const destination = this.movement.destination;
          this.destinationMarker.setPosition(destination.x, destination.y).setVisible(true);
          // Retoma o follow somente depois de exploração manual.
          this.cameraController.followPlayer();
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
    if (this.player) this.saveManager.save({ score: this.score, player: this.player.toSaveData() });

    this.performanceMonitor?.destroy();
    this.performanceMonitor = null;
    if (this.scene.isActive('GameUI')) this.scene.stop('GameUI');
    this.cameraController?.destroy();
    this.cameraController = null;
    this.camera = null;
    this.saveManager = null;
    this.savedProgress = null;
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
