export default class CombatSystem {
  constructor({ cooldownMs = 500, damage = 1 } = {}) {
    if (!Number.isFinite(cooldownMs) || cooldownMs < 0
      || !Number.isFinite(damage) || damage <= 0) {
      throw new TypeError('Combat cooldown and damage configuration are invalid.');
    }
    this.cooldownMs = cooldownMs;
    this.damage = damage;
    this.nextAttackAt = 0;
  }

  hitMonster(monster, now = Date.now()) {
    if (!monster || typeof monster.takeHit !== 'function'
      || monster.dead || !Number.isFinite(now) || now < this.nextAttackAt) {
      return { hit: false, defeated: false };
    }

    this.nextAttackAt = now + this.cooldownMs;
    monster.takeHit(this.damage);

    return {
      hit: true,
      defeated: Boolean(monster.dead)
    };
  }
}
