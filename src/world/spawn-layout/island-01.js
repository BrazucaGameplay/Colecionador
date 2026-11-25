/**
 * Zonas de surgimento da ilha inicial. Coordenadas ficam próximas às
 * bordas externas dos bosques, sem ocupar o espaço central de início.
 * A população só aparece quando a espécie possui atlas final habilitado.
 */
const zone = (id, x, y) => Object.freeze({
  id,
  speciesId: 'slime',
  x,
  y,
  radius: 90,
  maxAlive: 2,
  minPlayerDistance: 280,
  collisionRadius: 12,
  respawnMs: 12000,
  retryMs: 2500,
  spawnIntervalMs: 0,
  enabled: true
});

export const ISLAND_01_MONSTER_SPAWNS = Object.freeze([
  zone('slime-nw', 940, 1450),
  zone('slime-ne', 3150, 1450),
  zone('slime-sw', 940, 2650),
  zone('slime-se', 3150, 2650)
]);
