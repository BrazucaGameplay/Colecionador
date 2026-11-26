export default class CombatSystem {
  constructor({ player, movement, getTargets, onAttack = () => {}, attackRange = 150, detectionRange = 500, retargetIntervalMs = 250 } = {}) {
    if (!player || !movement || typeof getTargets !== 'function') throw new TypeError('CombatSystem exige jogador, movimento e consulta de alvos.');
    this.player = player; this.movement = movement; this.getTargets = getTargets; this.onAttack = onAttack;
    this.attackRange = Math.max(0, attackRange); this.detectionRange = Math.max(this.attackRange, detectionRange);
    this.retargetIntervalMs = Math.max(50, retargetIntervalMs);
this.nextAttackAt = 0; this.nextRetargetAt = 0; this.nextPathAt = 0; this.pathRefreshIntervalMs = 250; this.targetId = null; this.destroyed = false;
  }
  selectTarget() {
    let selected = null, selectedDistance = this.detectionRange;
    for (const target of this.getTargets() || []) {
      if (!target?.alive) continue;
      const distance = Math.hypot(target.x - this.player.x, target.y - this.player.y);
      if (distance <= selectedDistance) { selected = target; selectedDistance = distance; }
    }
    return selected;
  }
  update(now) {
    if (this.destroyed || !this.player.alive) { this.movement.stopAutomaticMovement(); return; }
    if (this.movement.hasManualDestination) { this.targetId = null; this.movement.stopAutomaticMovement(); return; }
    const targets = this.getTargets() || [];
    let target = targets.find(item => item?.id === this.targetId && item.alive);
    if (!target || now >= this.nextRetargetAt) {
      const previousTargetId = this.targetId;
      target = this.selectTarget(); this.targetId = target?.id ?? null; this.nextRetargetAt = now + this.retargetIntervalMs;
      if (this.targetId !== previousTargetId) this.nextPathAt = now;
    }
    if (!target) { this.movement.stopAutomaticMovement(); this.player.setMoving(false); return; }
    const dx = target.x - this.player.x, dy = target.y - this.player.y;
    const distance = Math.hypot(dx, dy); this.player.setFacing(dx, dy);
    if (distance > this.attackRange) {
      if (now >= this.nextPathAt) {
        this.movement.setAutomaticDestination(target.x, target.y);
        this.nextPathAt = now + this.pathRefreshIntervalMs;
      }
      return;
    }
    this.movement.stopAutomaticMovement(); this.player.setMoving(false);
    this.nextPathAt = now;
    if (now < this.nextAttackAt) return;
    const configuredAps = Number(this.player.stats?.attackSpeed);
    const aps = Math.max(0.1, Number.isFinite(configuredAps) ? configuredAps : 1);
    const attackIntervalMs = 1000 / aps;
    this.nextAttackAt = now + attackIntervalMs;
    this.player.markCombat(now);
    this.onAttack(target, this.player.getAttackDamage(target.defense), now, this.player.stats.penetration, attackIntervalMs);
  }
  destroy() {
    this.destroyed = true; this.movement?.stopAutomaticMovement(); this.player = null; this.movement = null;
    this.getTargets = null; this.onAttack = null; this.targetId = null;
  }
}