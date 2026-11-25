/**
 * Pure player state. This class has no Phaser, physics, input or rendering
 * dependencies. It can be created before the GLB is available.
 */
export default class Player {
  constructor({ x, y, speed = 220, maxHealth = 3 } = {}) {
    this.x = Number(x) || 0;
    this.y = Number(y) || 0;
    this.speed = speed;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.alive = true;
    this.moving = false;
    this.facing = { x: 0, y: 1 };
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setFacing(x, y) {
    const length = Math.hypot(x, y);
    if (length <= 0.0001) return;
    this.facing = { x: x / length, y: y / length };
  }

  setMoving(moving) {
    this.moving = Boolean(moving);
  }

  takeDamage(amount = 1) {
    if (!this.alive) return this.health;
    this.health = Math.max(0, this.health - Math.max(0, amount));
    if (this.health === 0) {
      this.alive = false;
      this.moving = false;
    }
    return this.health;
  }

  restoreHealth(amount = this.maxHealth) {
    this.health = Math.min(this.maxHealth, this.health + Math.max(0, amount));
    this.alive = this.health > 0;
    return this.health;
  }
}
