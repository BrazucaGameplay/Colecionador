import { access } from 'node:fs/promises';
import path from 'node:path';
import { MONSTER_DEFINITIONS } from '../src/data/monsters/index.js';

const directory = process.argv[2] || 'public/assets/monsters';
let enabledAssets = 0;

for (const definition of Object.values(MONSTER_DEFINITIONS)) {
  if (!definition.visual?.enabled) continue;

  for (const pack of Object.values(definition.visual.animations || {})) {
    const relative = pack.path.replace(/^assets\/monsters\//, '');
    const imagePath = path.join(directory, relative);
    await access(imagePath);
    enabledAssets += 1;
  }
}

console.log(enabledAssets
  ? 'Assets de monstros encontrados: ' + enabledAssets + ' imagens.'
  : 'Nenhum asset de monstro habilitado; validação de arquivos ignorada.');
