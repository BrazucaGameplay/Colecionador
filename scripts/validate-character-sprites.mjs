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
  const directions = new Map();
  for (const frame of metadata.frames) {
    const direction = Number(frame.direction);
    if (!Number.isInteger(direction) || direction < 0) throw new Error('Direção inválida: ' + jsonFile);
    directions.set(direction, (directions.get(direction) || 0) + 1);
  }
  if (metadata.directionCount !== directions.size) throw new Error('Quantidade de direções divergente: ' + jsonFile);
  const fw = Number(metadata.frameSize?.width), fh = Number(metadata.frameSize?.height);
  for (const [direction, count] of directions) {
    const columns = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / columns);
    if (columns * fw > 2048 || rows * fh > 2048) throw new Error(`Página direcional excede 2048px em ${jsonFile}, direção ${direction}`);
  }
  if (metadata.pivot?.mode !== 'per-frame-visible-bounds-grounded') {
    throw new Error('Pivô por quadro ausente: ' + jsonFile);
  }
  for (const frame of metadata.frames) {
    const pivotY = Number(frame.pivotY);
    if (!Number.isFinite(pivotY) || pivotY <= 0 || pivotY > 0.96) {
      throw new Error(
        `Pivô inválido em ${jsonFile} (direção ${frame.direction}, quadro ${frame.frame}): ${frame.pivotY}. ` +
        'O ponto de apoio precisa manter margem transparente abaixo do personagem.'
      );
    }
  }
  if (!metadata.normalization || !Number.isFinite(metadata.normalization.renderSize) || metadata.normalization.renderSize <= metadata.frameSize.width) {
    throw new Error('Normalização em resolução ampliada ausente: ' + jsonFile);
  }
  for (const frame of metadata.frames) {
    const bounds = frame.sourceBounds;
    if (!bounds || bounds.x < 2 || bounds.y < 2 || bounds.x + bounds.width > metadata.normalization.renderSize - 2 || bounds.y + bounds.height > metadata.normalization.renderSize - 2) {
      throw new Error('Quadro fonte sem margem de segurança: ' + jsonFile + ' (direção ' + frame.direction + ', quadro ' + frame.frame + ').');
    }
  }
}
console.log(`Anchors válidos: ${jsonFiles.length} spritesheets em ${directory}`);
