import { PLAYER_ATTACK_RANGE_WORLD_UNITS } from '../../config.js';

/**
 * Combate ofensivo dos monstros, independente do CombatSystem do jogador.
 * Não compartilha atributos nem estado: cada monstro mantém seus próprios
 * stats/cooldown; o jogador é apenas o alvo que recebe o dano.
 */
export default class MonsterCombatSystem {
  constructor({ player, getAttackers, attackRange = PLAYER_ATTACK_RANGE_WORLD_UNITS, onAttack = () => {} } = {}) {
    if (!player || typeof getAttackers !== 'function') {
      throw new TypeError('MonsterCombatSystem exige jogador e consulta de atacantes.');
    }
    this.player = player;
    this.getAttackers = getAttackers;
    this.attackRangeSquared = Math.max(0, attackRange) ** 2;
    this.onAttack = onAttack;
    this.nextAttackAt = new Map();
    this.destroyed = false;
  }

  update(now) {
    if (this.destroyed || !this.player?.alive) return;
    const attackers = this.getAttackers() || [];
    const activeIds = new Set();

    for (const entry of attackers) {
      const monster = entry?.entity;
      if (!monster?.alive || entry.mode !== 'combat') continue;
      activeIds.add(monster.id);

      const dx = this.player.x - monster.x;
      const dy = this.player.y - monster.y;
      if (dx * dx + dy * dy > this.attackRangeSquared) continue;

      monster.setFacing(dx, dy);
      if (now < (this.nextAttackAt.get(monster.id) ?? 0)) continue;

      const attacksPerSecond = Math.max(0.1, Number(monster.stats?.attackSpeed) || 1);
      const attackIntervalMs = 1000 / attacksPerSecond;
      this.nextAttackAt.set(monster.id, now + attackIntervalMs);

      const damage = Math.max(1, Math.floor(Number(monster.stats?.attack) || 1));
      const penetration = Math.max(0, Number(monster.stats?.penetration) || 0);
      const result = this.player.takeDamage(damage, now, penetration);
      entry.renderer?.play('attack', now);
      this.onAttack({ monster, damage: result.applied, result, now, attackIntervalMs });
    }

    // Evita acumular cooldowns de entidades já removidas/mortas.
    for (const id of this.nextAttackAt.keys()) {
      if (!activeIds.has(id)) this.nextAttackAt.delete(id);
    }
  }

  destroy() {
    this.destroyed = true;
    this.nextAttackAt.clear();
    this.player = null;
    this.getAttackers = null;
    this.onAttack = null;
  }
}
