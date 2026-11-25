import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { MONSTER_DEFINITIONS } from '../src/data/monsters/index.js';

const directory = process.argv[2] || 'public/assets/monsters';
let enabledPacks = 0;

for (const definition of Object.values(MONSTER_DEFINITIONS)) {
  if (!definition.visual?.enabled) continue;

  for (const pack of Object.values(definition.visual.animations || {})) {
    const relative = pack.path.replace(/^assets\/monsters\//, '');
    const base = path.join(directory, relative);
    const pngPath = base + '.png';
    const jsonPath = base + '.json';
    await access(pngPath);
    const metadata = JSON.parse(await readFile(jsonPath, 'utf8'));

    if (metadata.schema !== 'colecionador.sprite-atlas.v1') {
      throw new Error('Schema de atlas inválido: ' + jsonPath);
    }
    if (!Array.isArray(metadata.frames) || !metadata.frames.length) {
      throw new Error('Atlas sem quadros: ' + jsonPath);
    }
    if (!Number.isFinite(metadata.fps) || metadata.fps <= 0) {
      throw new Error('FPS inválido: ' + jsonPath);
    }

    const seen = new Set();
    for (const frame of metadata.frames) {
      const direction = Number(frame.direction);
      const index = Number(frame.frame);
      const x = Number(frame.x);
      const y = Number(frame.y);
      const width = Number(frame.width);
      const height = Number(frame.height);
      const pivotX = Number(frame.pivotX ?? metadata.pivot?.x);
      const pivotY = Number(frame.pivotY ?? metadata.pivot?.y);
      const key = direction + ':' + index;

      if (!Number.isInteger(direction) || direction < 0 || direction > 7 ||
          !Number.isInteger(index) || index < 0 ||
          ![x, y, width, height, pivotX, pivotY].every(Number.isFinite) ||
          x < 0 || y < 0 || width <= 0 || height <= 0 ||
          pivotX < 0 || pivotX > 1 || pivotY <= 0 || pivotY > 0.96) {
        throw new Error('Quadro/pivô inválido em ' + jsonPath + ': ' + key);
      }
      if (seen.has(key)) throw new Error('Quadro duplicado em ' + jsonPath + ': ' + key);
      seen.add(key);
    }
    if (!metadata.frames.some(frame => Number(frame.direction) === 0 && Number(frame.frame) === 0)) {
      throw new Error('Atlas precisa conter direção 0, quadro 0: ' + jsonPath);
    }
    enabledPacks += 1;
  }
}

console.log(enabledPacks
  ? 'Atlas de monstros validados: ' + enabledPacks + ' pacotes.'
  : 'Nenhum atlas de monstro habilitado; validação de arquivos ignorada.');
