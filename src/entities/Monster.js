import Phaser from 'phaser';
export default class Monster {
  constructor(scene, x, y) { this.scene = scene; this.spawn = { x, y }; this.hp = 2; this.dead = false; this.sprite = scene.physics.add.sprite(x, y, 'monster'); this.sprite.setCollideWorldBounds(true); this.nextMove = 0; }
    takeHit() { this.hp--; this.scene.tweens.add({ targets: this.sprite, scale: 1.4, duration: 80, yoyo: true }); if (this.hp <= 0) { this.dead = true; this.sprite.setVisible(false); this.sprite.setVelocity(0, 0); } }
      respawn() { this.hp = 2; this.dead = false; this.sprite.setVisible(true); this.sprite.setPosition(this.spawn.x, this.spawn.y); }
        update(now) { if (this.dead) return; if (now > this.nextMove) { this.nextMove = now + 800 + Math.random() * 800; const a = Math.random() * Math.PI * 2; this.sprite.setVelocity(Math.cos(a) * 60, Math.sin(a) * 60); } }
        }