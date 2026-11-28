/**
 * Catálogo único de waifus. Toda habilidade e passiva do jogador nasce
 * exclusivamente de uma carta cadastrada aqui.
 */
export const WAIFU_CATALOG = Object.freeze([
  Object.freeze({
    id: 'slime-maiden',
    name: 'Donzela Slime',
    cardAsset: 'assets/cards/waifus/carta.slime.webp',
    activeAbility: Object.freeze({
      id: 'blue-slime-projectile',
      name: 'Gosma Azul',
      description: 'Dispara automaticamente um projétil contra o alvo do combate.',
      kind: 'projectile',
      damage: 10,
      cooldownMs: 10000,
      projectileSpeed: 520
    }),
    passiveStats: Object.freeze({})
  })
]);
export function getWaifuDefinition(id) {
  return WAIFU_CATALOG.find(entry => entry.id === id) || null;
}
