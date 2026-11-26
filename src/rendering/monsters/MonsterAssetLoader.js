import {MONSTER_DEFINITIONS} from '../../data/monsters/index.js';
const BASE=import.meta.env.BASE_URL;
/** Preload de imagens WebP individuais. encodeURI preserva nomes com parênteses. */
export function queueMonsterAssets(loader,definitions=MONSTER_DEFINITIONS){
 for(const d of Object.values(definitions)){if(!d.visual?.enabled)continue;for(const p of Object.values(d.visual.animations||{})){if(p.path)loader.image(p.key,BASE+encodeURI(p.path));}}
}
