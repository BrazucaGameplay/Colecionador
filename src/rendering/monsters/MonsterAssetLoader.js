import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';
const BASE = import.meta.env.BASE_URL;
/** Carrega uma imagem WebP individual para cada estado do slime. */
export function queueMonsterAssets(loader, definitions = MONSTER_DEFINITIONS) {
  for (const definition of Object.values(definitions)) {
    if (!definition.visual?.enabled) continue;
    for (const pack of Object.values(definition.visual.animations || {})) {
      if (pack.path) loader.image(pack.key, BASE + pack.path);
    }
  }
}
