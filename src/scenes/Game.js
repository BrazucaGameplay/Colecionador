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
    this.combat = new CombatSystem({ cooldownMs: 500 });

    this.player = new Player(this, 480, 270);
    this.monster = new Monster(this, 200, 150);
    worldObjects.push(this.player.sprite, this.monster.sprite);

    this.physics.add.overlap(
      this.player.sprite,
      this.monster.sprite,
      () => this.hitMonster()
    );

    const savedData = this.saveManager.load();
    this.score = savedData.score;
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

  hitMonster() {
    const result = this.combat.hitMonster(this.monster, this.time.now);
    if (!result.defeated) return;

    this.score += 1;
    this.hud.setScore(this.score);
    this.saveManager.save({ score: this.score });

    this.time.delayedCall(600, () => this.monster.respawn());
  }

  shutdown() {
    this.controls?.destroy();
    this.controls = null;
    this.cameraControls?.destroy();
    this.cameraControls = null;
    this.hud?.destroy();
    this.hud = null;
    this.cameraController = null;
  }

  update() {
    const movement = this.controls.getMovementVector(this.cameraController.orientation);
    this.player.move(movement.x, movement.y);
    this.monster.update(this.time.now);
  }
}
