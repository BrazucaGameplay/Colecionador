/**
 * Uma população global de slimes distribuída por toda a área caminhável
 * da ilha. O spawner valida cada ponto na máscara real do terreno.
 */
export const ISLAND_01_MONSTER_SPAWNS = Object.freeze([
  Object.freeze({
    id: 'slime-island',
    speciesId: 'slime',
    x: 2048,
    y: 2048,
    radius: 2010,
    maxAlive: 100,
    minPlayerDistance: 0,
    collisionRadius: 12,
    respawnMs: 1000,
    retryMs: 1000,
    spawnIntervalMs: 1000,
    enabled: true
  })
]);
