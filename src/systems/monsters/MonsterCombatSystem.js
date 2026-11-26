import { PLAYER_ATTACK_RANGE_WORLD_UNITS } from '../../config.js';

/** Percorre apenas a coleção estável de atacantes em alcance de combate. */
export default class MonsterCombatSystem {
  constructor({ player, getAttackers, attackRange = PLAYER_ATTACK_RANGE_WORLD_UNITS, onAttack = () => {} } = {}) {
    if (!player || typeof getAttackers !== 'function') {
      throw new TypeError('MonsterCombatSystem exige jogador e consulta de atacantes.');
    }
    this.player = player;
    this.getAttackers = getAttackers;
    this.attackRangeSquared = Math.max(0, attackRange) ** 2;
    this.onAttack = onAttack;
    this.destroyed = false;
  }

  update(now) {
    if (this.destroyed || !this.player?.alive) return;
    const attackers = this.getAttackers();
    if (!attackers || (attackers.size ?? attackers.length ?? 0) === 0) return;
    for (const entry of attackers) {
      const monster = entry?.entity;
      if (!monster?.alive || entry.mode !== 'combat') continue;
      const dx = this.player.x - monster.x;
      const dy = this.player.y - monster.y;
      if (dx * dx + dy * dy > this.attackRangeSquared) continue;
      monster.setFacing(dx, dy);
      if (now < (monster.nextMonsterAttackAt || 0)) continue;
      const attacksPerSecond = Math.max(0.1, Number(monster.stats?.attackSpeed) || 1);
      const attackIntervalMs = 1000 / attacksPerSecond;
      monster.nextMonsterAttackAt = now + attackIntervalMs;
      const damage = Math.max(1, Math.floor(Number(monster.stats?.attack) || 1));
      const penetration = Math.max(0, Number(monster.stats?.penetration) || 0);
      monster.markCombat(now);
      const result = this.player.takeDamage(damage, now, penetration);
      entry.renderer?.play('attack', now);
      this.onAttack({ monster, damage: result.applied, result, now, attackIntervalMs });
    }
  }

  destroy() {
    this.destroyed = true;
    this.player = null;
    this.getAttackers = null;
    this.onAttack = null;
  }
}
