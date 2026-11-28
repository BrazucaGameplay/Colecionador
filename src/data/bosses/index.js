/**
 * Catálogo de entidades Boss únicas.
 * Registrar apenas conteúdo real aprovado; não criar definições fictícias.
 * Contrato: docs/ARQUITETURA_MONSTROS_E_BOSSES.md
 */
export const BOSS_DEFINITIONS = Object.freeze({});

export function getBossDefinition(id) {
  return BOSS_DEFINITIONS[id] || null;
}
