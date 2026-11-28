import { getWaifuDefinition } from '../../data/waifus/catalog.js';

/** Executa exclusivamente habilidades declaradas no catálogo de cartas equipadas. */
export default class WaifuAbilitySystem {
  constructor({ equipment, onProjectile = () => {} } = {}) {
    this.equipment = equipment; this.onProjectile = onProjectile;
    this.nextActivationAt = new Map(); this.destroyed = false;
  }
  tryActivate(target, now = 0) {
    if (this.destroyed || !target?.alive || !this.equipment) return [];
    const activated = [];
    for (const card of this.equipment.getEquipped()) {
      const ability = getWaifuDefinition(card.waifuId)?.activeAbility;
      if (!ability) continue;
      const key = card.instanceId;
      if (now < (this.nextActivationAt.get(key) || 0)) continue;
      this.nextActivationAt.set(key, now + ability.cooldownMs);
      this.onProjectile({ card, ability, target, now });
      activated.push({ cardInstanceId: key, abilityId: ability.id, targetId: target.id });
    }
    return activated;
  }
  destroy() { this.destroyed = true; this.nextActivationAt.clear(); this.equipment = null; this.onProjectile = null; }
}
