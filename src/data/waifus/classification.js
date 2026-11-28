/**
 * Classificações oficiais das waifus.
 * Raridade é definida no cadastro da personagem; qualidade é definida
 * uma única vez quando a waifu é obtida. Nenhuma das duas evolui.
 */

export const WAIFU_RARITIES = Object.freeze({
  COMMON: Object.freeze({ id: 'common', name: 'Comum', symbol: 'circle', frameAsset: 'frames/common.webp' }),
  RARE: Object.freeze({ id: 'rare', name: 'Rara', symbol: 'diamond', frameAsset: 'frames/rare.webp' }),
  EPIC: Object.freeze({ id: 'epic', name: 'Épica', symbol: 'star', frameAsset: 'frames/epic.webp' }),
  LEGENDARY: Object.freeze({ id: 'legendary', name: 'Lendária', symbol: 'crown', frameAsset: 'frames/legendary.webp' }),
  MYTHICAL: Object.freeze({ id: 'mythical', name: 'Mítica', symbol: 'celestial-star', frameAsset: 'frames/mythical.webp' })
});

export const WAIFU_QUALITIES = Object.freeze({
  D: Object.freeze({ id: 'D', name: 'Plebeia', sealAsset: 'seals/plebeia.webp' }),
  C: Object.freeze({ id: 'C', name: 'Nobre', sealAsset: 'seals/nobre.webp' }),
  B: Object.freeze({ id: 'B', name: 'Dama', sealAsset: 'seals/dama.webp' }),
  A: Object.freeze({ id: 'A', name: 'Princesa', sealAsset: 'seals/princesa.webp' }),
  S: Object.freeze({ id: 'S', name: 'Rainha', sealAsset: 'seals/rainha.webp' })
});

export const WAIFU_RARITY_IDS = Object.freeze(
  Object.values(WAIFU_RARITIES).map(({ id }) => id)
);

export const WAIFU_QUALITY_IDS = Object.freeze(
  Object.values(WAIFU_QUALITIES).map(({ id }) => id)
);

export function isWaifuRarity(value) {
  return WAIFU_RARITY_IDS.includes(value);
}

export function isWaifuQuality(value) {
  return WAIFU_QUALITY_IDS.includes(value);
}
