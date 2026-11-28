import { getMonsterDropTable } from '../../data/monsters/drop-tables.js';
import { isWaifuQuality } from '../../data/waifus/classification.js';

function randomUnit(random) {
  const value = Number(random());
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('A função aleatória deve retornar um número no intervalo [0, 1).');
  }
  return value;
}

function resolveWeightedQuality(weights, random) {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (total !== 100 || weights.some(entry => !isWaifuQuality(entry.quality) || !Number.isFinite(entry.weight) || entry.weight < 0)) {
    throw new Error('Pesos de qualidade inválidos: a soma deve ser exatamente 100.');
  }

  const ticket = randomUnit(random) * total;
  let cumulative = 0;
  for (const entry of weights) {
    cumulative += entry.weight;
    if (ticket < cumulative) return entry.quality;
  }
  return weights.at(-1).quality;
}

/**
 * Faz uma única avaliação de cada entrada da tabela da espécie.
 * Para cartas, a qualidade só consome uma segunda rolagem se a carta cair.
 */
export function rollMonsterDrops(speciesId, { random = Math.random } = {}) {
  if (typeof random !== 'function') throw new TypeError('random precisa ser uma função.');
  const table = getMonsterDropTable(speciesId);
  const results = [];

  for (const entry of table) {
    if (randomUnit(random) >= entry.chance) continue;

    if (entry.kind === 'waifu-card') {
      results.push(Object.freeze({
        kind: entry.kind,
        dropId: entry.id,
        waifuId: entry.waifuId,
        name: entry.name,
        quality: resolveWeightedQuality(entry.qualityWeights, random)
      }));
      continue;
    }

    results.push(Object.freeze({ kind: entry.kind, dropId: entry.id }));
  }

  return Object.freeze(results);
}
