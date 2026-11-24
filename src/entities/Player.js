import Phaser from 'phaser';
import { PLAYER_CONFIG } from '../config/PlayerConfig.js';

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.speed = PLAYER_CONFIG.movement.speed;
  }

  move(vx, vy) {
    const length = Math.hypot(vx, vy) || 1;
    this.sprite.setVelocity(
      (vx / length) * this.speed,
      (vy / length) * this.speed
    );

    if (vx || vy) {
      this.sprite.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    }
  }
}
