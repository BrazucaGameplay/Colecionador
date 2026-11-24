export default class CombatSystem {
  constructor({ cooldownMs = 500 } = {}) {
    this.cooldownMs = cooldownMs;
    this.nextAttackAt = 0;
  }

  hitMonster(monster, now = Date.now()) {
    if (!monster || monster.dead || now < this.nextAttackAt) {
      return { hit: false, defeated: false };
    }

    this.nextAttackAt = now + this.cooldownMs;
    monster.takeHit();

    return {
      hit: true,
      defeated: Boolean(monster.dead)
    };
  }
}
