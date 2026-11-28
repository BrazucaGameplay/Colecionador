/**
 * Tabelas de drop exclusivas por espécie.
 *
 * Cada espécie declara sua própria tabela; não há fallback compartilhado
 * que faça um monstro conceder conteúdo de outra espécie.
 *
 * Chance da carta: 20% por morte elegível do Slime.
 * Qualidade é sorteada somente quando a carta cai.
 */
export const MONSTER_DROP_TABLES = Object.freeze({
  slime: Object.freeze([
    Object.freeze({
      id: 'slime-maiden-card',
      kind: 'waifu-card',
      waifuId: 'slime-maiden',
      name: 'Donzela Slime',
      chance: 0.20,
      qualityWeights: Object.freeze([
        Object.freeze({ quality: 'S', weight: 1 }),
        Object.freeze({ quality: 'A', weight: 2 }),
        Object.freeze({ quality: 'B', weight: 3 }),
        Object.freeze({ quality: 'C', weight: 4 }),
        Object.freeze({ quality: 'D', weight: 90 })
      ])
    })
  ])
});

export function getMonsterDropTable(speciesId) {
  return MONSTER_DROP_TABLES[speciesId] || Object.freeze([]);
}
