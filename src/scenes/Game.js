import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import InputController from '../systems/InputController.js';
import CombatSystem from '../systems/CombatSystem.js';
import SaveManager from '../core/SaveManager.js';
import CameraController from '../world/CameraController.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import CameraControls from '../ui/CameraControls.js';
import HUD from '../ui/HUD.js';
import MovementSystem from '../systems/MovementSystem.js';
import EventBus from '../core/EventBus.js';
import ProgressManager from '../systems/ProgressManager.js';
import MonsterBehaviorSystem from '../systems/MonsterBehaviorSystem.js';
import { COMBAT_CONFIG } from '../config/CombatConfig.js';
import { MONSTER_CONFIG } from '../config/MonsterConfig.js';
import { CAMERA_CONFIG } from '../config/CameraConfig.js';
import { PLAYER_CONFIG } from '../config/PlayerConfig.js';
import { WORLD_CONFIG } from '../config/WorldConfig.js';
import WorldManager from '../world/WorldManager.js';
import DepthSortingSystem from '../world/DepthSortingSystem.js';
import WorldEntitySyncSystem from '../systems/WorldEntitySyncSystem.js';
import { tileToWorld } from '../world/IsometricProjection.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const worldObjects = [];
    const preview = WORLD_CONFIG.prototypePreview;
    const metrics = {
      tileWidth: preview.tileWidth,
      tileHeight: preview.tileHeight,
      originX: preview.originX,
      originY: preview.originY
    };
    const worldWidth = ((preview.columns + preview.rows - 2) * preview.tileWidth / 2)
      + preview.tileWidth;
    const worldHeight = ((preview.columns + preview.rows - 2) * preview.tileHeight / 2)
      + preview.tileHeight;

    this.worldManager = new WorldManager({
      scene: this,
      width: preview.columns,
      height: preview.rows,
      playerBodyTile: preview.playerSpawnTile,
      tileWidth: metrics.tileWidth,
      tileHeight: metrics.tileHeight,
      originX: metrics.originX,
      originY: metrics.originY
    });

    const mapTiles = [];
    for (let y = 0; y < preview.rows; y++) {
      for (let x = 0; x < preview.columns; x++) {
        mapTiles.push({ x, y, texture: 'tile' });
      }
    }
    worldObjects.push(...this.worldManager.render(mapTiles));
    this.saveManager = new SaveManager();
    this.eventBus = new EventBus();
    this.progress = new ProgressManager({
      eventBus: this.eventBus,
      saveManager: this.saveManager
    });
    this.combat = new CombatSystem(COMBAT_CONFIG.prototype);

    const playerSpawn = tileToWorld(preview.playerSpawnTile, metrics);
    this.player = new Player(this, playerSpawn.x, playerSpawn.y);
    this.monsters = preview.monsterSpawnTiles.map(tile => {
      const spawn = tileToWorld(tile, metrics);
      return new Monster(this, spawn.x, spawn.y, MONSTER_CONFIG.prototype);
    });
    worldObjects.push(this.player.sprite, ...this.monsters.map(monster => monster.sprite));

    for (const monster of this.monsters) {
      this.physics.add.overlap(
        this.player.sprite,
        monster.sprite,
        () => this.hitMonster(monster)
      );
    }
    this.monsterBehavior = new MonsterBehaviorSystem({
      monsters: this.monsters,
      config: MONSTER_CONFIG.prototype
    });

    this.score = this.progress.load().score;
    this.hud = new HUD(this, { hp: PLAYER_CONFIG.health.initial, score: this.score });

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.worldCamera = this.cameras.main;
    this.worldCamera.setBounds(0, 0, worldWidth, worldHeight);
    this.worldCamera.startFollow(
      this.player.sprite,
      true,
      CAMERA_CONFIG.follow.lerpX,
      CAMERA_CONFIG.follow.lerpY
    );
    this.cameraController = new CameraController(this.worldCamera);

    // A camera secundaria desenha somente a interface, sem herdar a rotacao do mundo.
    this.uiCamera = this.cameras
      .add(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setName('hud');
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setRotation(0);

    this.controls = new InputController(this, { worldCamera: this.worldCamera });
    this.movement = new MovementSystem({
      player: this.player,
      inputController: this.controls,
      cameraController: this.cameraController
    });
    this.cameraControls = new CameraControls(this, this.cameraController);
    this.depthSorting = new DepthSortingSystem();
    this.worldSync = new WorldEntitySyncSystem({
      player: this.player,
      monsters: this.monsters,
      worldManager: this.worldManager,
      metrics,
      depthSorting: this.depthSorting
    });

    this.worldLayer = this.add.group(worldObjects);
    this.uiLayer = this.add.group([
      ...this.hud.objects,
      this.controls.touch.base,
      this.controls.touch.knob,
      ...this.cameraControls.objects
    ]);

    this.worldCamera.ignore(this.uiLayer);
    this.uiCamera.ignore(this.worldLayer);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  hitMonster(monster) {
    const result = this.combat.hitMonster(monster, this.time.now);
    if (!result.defeated) return;

    this.score += 1;
    this.hud.setScore(this.score);
    this.progress.setScore(this.score);
    this.progress.save();

    this.time.delayedCall(600, () => monster.respawn());
  }

  shutdown() {
    this.controls?.destroy();
    this.controls = null;
    this.movement?.destroy();
    this.movement = null;
    this.monsterBehavior?.destroy();
    this.monsterBehavior = null;
    this.worldSync?.destroy();
    this.worldSync = null;
    this.worldManager?.destroy();
    this.worldManager = null;
    this.cameraControls?.destroy();
    this.cameraControls = null;
    this.hud?.destroy();
    this.hud = null;
    this.cameraController = null;
    this.eventBus?.clear();
    this.eventBus = null;
    this.progress = null;
  }

  update() {
    this.movement.update();
    this.monsterBehavior.update(this.time.now);
    this.worldSync.update();
  }
}
