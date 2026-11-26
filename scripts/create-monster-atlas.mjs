#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [pngPath, jsonPath, cellWidthArg, cellHeightArg, framesArg, fpsArg, pivotXArg, pivotYArg] = process.argv.slice(2);
const cellWidth = Number(cellWidthArg);
const cellHeight = Number(cellHeightArg);
const framesPerDirection = Number(framesArg);
const fps = Number(fpsArg);
const pivotX = pivotXArg === undefined ? 0.5 : Number(pivotXArg);
const pivotY = pivotYArg === undefined ? 0.9375 : Number(pivotYArg);
const directionCount = 8;

if (!pngPath || !jsonPath ||
    ![cellWidth, cellHeight, framesPerDirection, fps, pivotX, pivotY].every(Number.isFinite) ||
    ![cellWidth, cellHeight, framesPerDirection, fps].every(value => Number.isInteger(value) && value > 0) ||
    pivotX < 0 || pivotX > 1 || pivotY <= 0 || pivotY > 0.96) {
  console.error('Uso: node scripts/create-monster-atlas.mjs PNG JSON largura altura quadrosPorDirecao FPS [pivotX] [pivotY]');
  process.exit(1);
}

const png = await readFile(pngPath);
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (png.length < 24 || !png.subarray(0, 8).equals(signature) || png.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('O arquivo informado não é um PNG válido: ' + pngPath);
}

const atlasWidth = png.readUInt32BE(16);
const atlasHeight = png.readUInt32BE(20);
const expectedWidth = cellWidth * framesPerDirection;
const expectedHeight = cellHeight * directionCount;
if (atlasWidth !== expectedWidth || atlasHeight !== expectedHeight) {
  throw new Error(
    'Dimensões do PNG incompatíveis. Esperado ' + expectedWidth + 'x' + expectedHeight +
    ' (8 direções × ' + framesPerDirection + ' quadros); recebido ' + atlasWidth + 'x' + atlasHeight + '.'
  );
}

const frames = [];
for (let direction = 0; direction < directionCount; direction += 1) {
  for (let frame = 0; frame < framesPerDirection; frame += 1) {
    frames.push({
      frame,
      direction,
      x: frame * cellWidth,
      y: direction * cellHeight,
      width: cellWidth,
      height: cellHeight,
      pivotX,
      pivotY
    });
  }
}

const metadata = {
  schema: 'colecionador.sprite-atlas.v1',
  source: path.basename(pngPath),
  animation: path.basename(pngPath, path.extname(pngPath)),
  fps,
  frameSize: { width: cellWidth, height: cellHeight },
  frameCount: framesPerDirection,
  directionCount,
  atlas: {
    width: atlasWidth,
    height: atlasHeight,
    columns: framesPerDirection,
    rows: directionCount
  },
  pivot: { x: pivotX, y: pivotY, mode: 'shared-ground-contact' },
  frames
};

await writeFile(jsonPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
console.log('JSON de atlas criado: ' + jsonPath);
console.log(frames.length + ' quadros; ' + directionCount + ' direções; ' + fps + ' FPS.');
