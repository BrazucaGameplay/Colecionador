import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import TouchControls from '../systems/touch.js';
import { SAVE_KEY } from '../config.js';

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }
    create() {
        for (let y = 0; y < 17; y++) for (let x = 0; x < 30; x++) { if ((x + y) % 7 === 0) this.add.image(x * 32 + 16, y * 32 + 16, 'tile').setAlpha(.25); }
            this.player = new Player(this, 480, 270);
                this.monster = new Monster(this, 200, 150);
                    this.physics.add.overlap(this.player.sprite, this.monster.sprite, () => this.hitMonster());
                        this.touch = new TouchControls(this);
                            this.cursors = this.input.keyboard.createCursorKeys();
                                this.wasd = this.input.keyboard.addKeys('W,A,S,D');
                                    this.hp = 3;
                                        this.hpText = this.add.text(16, 16, 'HP ' + this.hp, { fontSize: '20px', color: '#fff' }).setScrollFactor(0);
                                            this.score = 0;
                                                this.scoreText = this.add.text(16, 44, 'Monstros: ' + this.score, { fontSize: '18px', color: '#fff' }).setScrollFactor(0);
                                                    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
                                                        this.cameras.main.setBounds(0, 0, 960, 540);
                                                            this._cooldown = 0;
                                                              }
                                                                hitMonster() {
                                                                    if (this._cooldown > this.time.now) return;
                                                                        this._cooldown = this.time.now + 500;
                                                                            this.monster.takeHit();
                                                                                if (this.monster.dead) {
                                                                                      this.score++;
                                                                                            this.scoreText.setText('Monstros: ' + this.score);
                                                                                                  localStorage.setItem(SAVE_KEY, JSON.stringify({ score: this.score, at: Date.now() }));
                                                                                                        this.time.delayedCall(600, () => this.monster.respawn());
                                                                                                            }
                                                                                                              }
                                                                                                                update() {
                                                                                                                    const t = this.touch.vector;
                                                                                                                        let vx = t.x, vy = t.y;
                                                                                                                            if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
                                                                                                                                if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
                                                                                                                                    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
                                                                                                                                        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;
                                                                                                                                            this.player.move(vx, vy);
                                                                                                                                                this.monster.update(this.time.now);
                                                                                                                                                  }
                                                                                                                                                  }