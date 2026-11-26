/**
 * Estado lógico puro de um monstro. Não importa Phaser, física, input ou arte.
 */
export default class Monster {
  constructor({ id, speciesId, x, y, definition, spawnZoneId }) {
    if (!id || !speciesId || !definition) {
      throw new TypeError('Monster exige id, speciesId e definition.');
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError('A posição inicial do monstro precisa ser numérica.');
    }

    this.id = id;
    this.speciesId = speciesId;
    this.definition = definition;
    this.spawnZoneId = spawnZoneId;
    this.x = x;
    this.y = y;
    // Mesmo contrato de atributos do Player, mas com estado próprio e valores-base 1.
    const configuredStats = definition.stats && typeof definition.stats === 'object' ? definition.stats : {};
    this.stats = Object.freeze({
      attack: 1, defense: 1, penetration: 1, attackSpeed: 1,
      movementSpeed: 1, maxHealth: 1, maxEnergy: 1,
      healthRegen: 1, energyRegen: 1,
      ...Object.fromEntries(Object.keys({
        attack: 1, defense: 1, penetration: 1, attackSpeed: 1,
        movementSpeed: 1, maxHealth: 1, maxEnergy: 1,
        healthRegen: 1, energyRegen: 1
      }).map(key => [key, Number.isFinite(Number(configuredStats[key])) ? Math.max(0, Number(configuredStats[key])) : 1]))
    });
    this.maxHealth = this.stats.maxHealth;
    this.health = this.maxHealth;
    this.speed = Math.max(0, Number(definition.speed) || 0) * this.stats.movementSpeed;
    this.defense = this.stats.defense;
    this.moving = false;
    this.facing = { x: 0, y: 1 };
    this.state = 'alive';
  }

  get alive() {
    return this.state === 'alive';
  }

  get dead() {
    return this.state === 'dead';
  }

  setPosition(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    this.x = x;
    this.y = y;
    return true;
  }

  setFacing(x, y) {
    const length = Math.hypot(x, y);
    if (length <= 0.0001) return;
    this.facing = { x: x / length, y: y / length };
  }

  setMoving(moving) {
    this.moving = this.alive && Boolean(moving);
  }

  takeDamage(amount = 1, penetration = 0) {
    if (!this.alive) return { applied: 0, health: this.health, dead: this.dead };

    const rawDamage = Math.max(0, Math.floor(Number(amount) || 0));
    const effectiveDefense = Math.max(0, this.defense - Math.max(0, Math.floor(Number(penetration) || 0)));
    const applied = Math.max(0, rawDamage - effectiveDefense);
    if (applied <= 0) return { applied: 0, health: this.health, dead: false };

    this.health = Math.max(0, this.health - applied);
    if (this.health === 0) {
      this.state = 'dead';
      this.moving = false;
    }
    return { applied, health: this.health, dead: this.dead };
  }

  restore() {
    this.health = this.maxHealth;
    this.state = 'alive';
    this.moving = false;
    this.facing = { x: 0, y: 1 };
  }
}
