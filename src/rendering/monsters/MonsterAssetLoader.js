import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';

const BASE = import.meta.env.BASE_URL;

/**
 * Os assets atuais do slime são quatro imagens WebP individuais, uma por
 * estado. Não exigem atlas, JSON auxiliar ou conversão prévia.
 */
export function queueMonsterAssets(loader, definitions = MONSTER_DEFINITIONS) {
  for (const definition of Object.values(definitions)) {
    const visual = definition.visual;
    if (!visual?.enabled) continue;

    for (const pack of Object.values(visual.animations || {})) {
      if (!pack.path) continue;
      loader.image(pack.key, BASE + pack.path);
    }
  }
}
