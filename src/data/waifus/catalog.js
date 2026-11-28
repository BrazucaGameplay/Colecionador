/**
 * Catálogo central de waifus.
 *
 * Permanece vazio até que cada personagem seja cadastrada com seus dados
 * confirmados e sua arte original final. Não registrar personagens fictícias
 * nem inferir waifus apenas pela existência de arquivos de imagem.
 *
 * Contrato esperado por entrada:
 * {
 *   id: string,
 *   name: string,
 *   rarity: WAIFU_RARITIES.*.id, // fixa no cadastro
 *   cardAsset: string,          // ilustração original, sem moldura
 *   monsterDropIds: string[]    // IDs reais dos monstros que podem concedê-la
 * }
 */
export const WAIFU_CATALOG = Object.freeze([]);
