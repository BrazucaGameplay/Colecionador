import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';

const directory = process.argv[2] || 'public/assets/characters/sprites/skin_01';
const entries = await readdir(directory);
const jsonFiles = entries.filter((name) => name.endsWith('.json')).sort();
if (!jsonFiles.length) throw new Error('Nenhum metadata de spritesheet encontrado em ' + directory);

for (const jsonFile of jsonFiles) {
  const stem = jsonFile.slice(0, -5);
  await access(path.join(directory, stem + '.png'));
  const metadata = JSON.parse(await readFile(path.join(directory, jsonFile), 'utf8'));
  if (!Array.isArray(metadata.frames) || !metadata.frames.length) {
    throw new Error('Spritesheet sem quadros: ' + jsonFile);
  }
  if (metadata.pivot?.mode !== 'per-frame-opaque-bottom') {
    throw new Error('Pivô por quadro ausente: ' + jsonFile);
  }
  for (const frame of metadata.frames) {
    const pivotY = Number(frame.pivotY);
    if (!Number.isFinite(pivotY) || pivotY <= 0 || pivotY > 1) {
      throw new Error(
        `Pivô inválido em ${jsonFile} (direção ${frame.direction}, quadro ${frame.frame}): ${frame.pivotY}. ` +
        'O ponto de apoio precisa estar dentro do quadro.'
      );
    }
  }
}
console.log(`Anchors válidos: ${jsonFiles.length} spritesheets em ${directory}`);
