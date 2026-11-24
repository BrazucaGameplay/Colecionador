import { MONSTER_CONFIG } from '../config/MonsterConfig.js';

export default class Monster {
  constructor(scene, x, y, config = MONSTER_CONFIG.prototype) {
    if (!scene?.physics?.add || !Number.isSafeInteger(config.maxHealth) || config.maxHealth < 1) {
      throw new TypeError('Scene and positive monster health configuration are required.');
    }

    this.scene = scene;
    this.spawn = { x, y };
    this.maxHealth = config.maxHealth;
    this.hp = this.maxHealth;
    this.dead = false;
    this.sprite = scene.physics.add.sprite(x, y, 'monster');
    this.sprite.setCollideWorldBounds(true);
  }

  takeHit(damage = 1) {
    if (this.dead || !Number.isFinite(damage) || damage <= 0) return false;

    this.hp = Math.max(0, this.hp - damage);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.4,
      duration: 80,
      yoyo: true
    });

    if (this.hp === 0) {
      this.dead = true;
      this.sprite.setVisible(false);
      this.sprite.setVelocity(0, 0);
    }
    return true;
  }

  respawn() {
    this.hp = this.maxHealth;
    this.dead = false;
    this.sprite.setVisible(true);
    this.sprite.setPosition(this.spawn.x, this.spawn.y);
    this.sprite.setVelocity(0, 0);
  }

  destroy() {
    this.sprite.destroy();
    this.scene = null;
  }
}
