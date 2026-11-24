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

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const worldObjects = [];

    // Conteudo visual temporario do prototipo; sera substituido pelo MapRenderer.
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 30; x++) {
        if ((x + y) % 7 === 0) {
          worldObjects.push(
            this.add.image(x * 32 + 16, y * 32 + 16, 'tile').setAlpha(0.25)
          );
        }
      }
    }

    this.saveManager = new SaveManager();
    this.eventBus = new EventBus();
    this.progress = new ProgressManager({
      eventBus: this.eventBus,
      saveManager: this.saveManager
    });
    this.combat = new CombatSystem(COMBAT_CONFIG.prototype);

    this.player = new Player(this, 480, 270);
    this.monsters = [new Monster(this, 200, 150, MONSTER_CONFIG.prototype)];
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
    this.hud = new HUD(this, { hp: 3, score: this.score });

    this.worldCamera = this.cameras.main;
    this.worldCamera.setBounds(0, 0, 960, 544);
    this.worldCamera.startFollow(this.player.sprite, true, 0.1, 0.1);
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
  }
}
