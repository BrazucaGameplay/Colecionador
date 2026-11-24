import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import InputController from '../systems/InputController.js';
import CombatSystem from '../systems/CombatSystem.js';
import SaveManager from '../core/SaveManager.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 30; x++) {
        if ((x + y) % 7 === 0) {
          this.add.image(x * 32 + 16, y * 32 + 16, 'tile').setAlpha(0.25);
        }
      }
    }

    this.saveManager = new SaveManager();
    this.combat = new CombatSystem({ cooldownMs: 500 });

    this.player = new Player(this, 480, 270);
    this.monster = new Monster(this, 200, 150);
    this.physics.add.overlap(
      this.player.sprite,
      this.monster.sprite,
      () => this.hitMonster()
    );

    this.controls = new InputController(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.hp = 3;
    this.hpText = this.add.text(16, 16, 'HP ' + this.hp, {
      fontSize: '20px',
      color: '#fff'
    }).setScrollFactor(0);

    const savedData = this.saveManager.load();
    this.score = savedData.score;
    this.scoreText = this.add.text(16, 44, 'Monstros: ' + this.score, {
      fontSize: '18px',
      color: '#fff'
    }).setScrollFactor(0);

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 960, 540);
  }

  hitMonster() {
    const result = this.combat.hitMonster(this.monster, this.time.now);
    if (!result.defeated) return;

    this.score += 1;
    this.scoreText.setText('Monstros: ' + this.score);
    this.saveManager.save({ score: this.score });

    this.time.delayedCall(600, () => this.monster.respawn());
  }

  shutdown() {
    this.controls?.destroy();
    this.controls = null;
  }

  update() {
    const movement = this.controls.getMovementVector();
    this.player.move(movement.x, movement.y);
    this.monster.update(this.time.now);
  }
}
