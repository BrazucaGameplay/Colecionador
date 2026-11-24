import { MONSTER_CONFIG } from '../config/MonsterConfig.js';

export default class MonsterBehaviorSystem {
  constructor({ monsters = [], config = MONSTER_CONFIG.prototype, random = Math.random } = {}) {
    if (!Array.isArray(monsters) || typeof random !== 'function') {
      throw new TypeError('Monster collection and random function are required.');
    }

    const { speed, intervalMinMs, intervalMaxMs } = config.wander;
    if (!Number.isFinite(speed) || speed < 0
      || !Number.isFinite(intervalMinMs) || intervalMinMs < 0
      || !Number.isFinite(intervalMaxMs) || intervalMaxMs < intervalMinMs) {
      throw new TypeError('Monster wander configuration is invalid.');
    }

    this.monsters = monsters;
    this.config = config;
    this.random = random;
    this.nextMoveAt = new Map();
  }

  update(now) {
    if (!Number.isFinite(now)) {
      throw new TypeError('Monster behavior update time must be finite.');
    }
    if (!this.config.wander.enabled) return;

    for (const monster of this.monsters) {
      if (!monster || monster.dead || !monster.sprite) continue;
      const nextMove = this.nextMoveAt.get(monster) ?? 0;
      if (now < nextMove) continue;

      const { speed, intervalMinMs, intervalMaxMs } = this.config.wander;
      const angle = this.random() * Math.PI * 2;
      const interval = intervalMinMs
        + (this.random() * (intervalMaxMs - intervalMinMs));

      monster.sprite.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      this.nextMoveAt.set(monster, now + interval);
    }
  }

  add(monster) {
    if (!monster || !monster.sprite || this.monsters.includes(monster)) return false;
    this.monsters.push(monster);
    return true;
  }

  remove(monster) {
    const index = this.monsters.indexOf(monster);
    if (index < 0) return false;
    this.monsters.splice(index, 1);
    this.nextMoveAt.delete(monster);
    return true;
  }

  destroy() {
    this.nextMoveAt.clear();
    this.monsters = [];
  }
}
