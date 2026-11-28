import { MONSTER_DEFINITIONS } from '../monsters/index.js';
import { BOSS_DEFINITIONS } from '../bosses/index.js';

function toEntry(definition, category) {
  return Object.freeze({
    id: definition.id,
    category,
    name: definition.name,
    description: definition.bestiary?.description ?? null,
    cardAsset: definition.bestiary?.cardAsset ?? null,
    definition
  });
}

/**
 * Projeta os catálogos estáticos em duas coleções.
 * Descoberta, encontros e derrotas pertencem ao estado salvo do jogador.
 */
export function getBestiaryCatalog() {
  return Object.freeze({
    monsters: Object.freeze(Object.values(MONSTER_DEFINITIONS).map(item => toEntry(item, 'monster'))),
    bosses: Object.freeze(Object.values(BOSS_DEFINITIONS).map(item => toEntry(item, 'boss')))
  });
}

export function getBestiaryEntries(category) {
  const catalog = getBestiaryCatalog();
  if (category === 'monsters' || category === 'monster') return catalog.monsters;
  if (category === 'bosses' || category === 'boss') return catalog.bosses;
  if (category == null || category === 'all') return Object.freeze([...catalog.monsters, ...catalog.bosses]);
  return Object.freeze([]);
}
