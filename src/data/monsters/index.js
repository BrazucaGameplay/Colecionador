const animation = (id, file, loop) => Object.freeze({ id, key: 'monster-slime-' + id, path: 'assets/monsters/slime/' + file, loop });
const slimeAnimations = Object.freeze({
  idle: animation('idle', 'parado_01.webp', true),
  walking: animation('walking', 'slime_movimento_frame_02_webp.webp', true),
  attack: animation('attack', 'slime_ataque_frame_02(1).webp', false),
  death: animation('death', 'slime_morte_frame_02.webp', false)
});
export const MONSTER_DEFINITIONS = Object.freeze({
  slime: Object.freeze({
    id: 'slime', name: 'Slime', maxHealth: 1, speed: 60, defense: 1,
    stats: Object.freeze({
      attack: 1, defense: 1, penetration: 1, attackSpeed: 1,
      movementSpeed: 1, maxHealth: 1, maxEnergy: 1,
      healthRegen: 1, energyRegen: 1
    }),
    experience: 25, drops: Object.freeze([]),
    collision: Object.freeze({ radius: 18 }), deathDurationMs: 600,
    visual: Object.freeze({
      enabled: true, scale: 0.72, shadowScale: 1.5, originX: 0.5, originY: 0.92,
      animations: slimeAnimations
    })
  })
});
export function getMonsterDefinition(id) { return MONSTER_DEFINITIONS[id] || null; }
