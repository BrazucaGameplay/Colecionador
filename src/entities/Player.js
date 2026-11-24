import Phaser from 'phaser';
export default class Player {
  constructor(scene, x, y) { this.scene = scene; this.sprite = scene.physics.add.sprite(x, y, 'player'); this.sprite.setCollideWorldBounds(true); this.speed = 220; }
    move(vx, vy) {
        const len = Math.hypot(vx, vy) || 1;
            this.sprite.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
                if (vx || vy) this.sprite.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
                  }
                  }