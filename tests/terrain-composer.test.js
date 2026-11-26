import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { materialScore } from '../src/world/TerrainComposer.js';

test('campo de distribuição é periódico nos dois eixos', () => {
  for (const [x, y] of [[0, 0], [1, 73], [127, 511], [255, 256], [511, 19]]) {
    assert.ok(Math.abs(materialScore(x, y) - materialScore(x + 512, y)) < 1e-10);
    assert.ok(Math.abs(materialScore(x, y) - materialScore(x, y + 512)) < 1e-10);
  }
});

test('o compositor prepara materiais seamless e escreve um único padrão 512px', () => {
  const source = readFileSync(new URL('../src/world/TerrainComposer.js', import.meta.url), 'utf8');
  assert.match(source, /PATTERN_SIZE = 512/);
  assert.match(source, /readSeamlessPixels/);
  assert.match(source, /getImageData/);
  assert.match(source, /putImageData/);
  assert.match(source, /scene\.textures\.addCanvas/);
  assert.doesNotMatch(source, /createAlphaMask|drawMaskedMaterial/);
});

test('a ilha usa máscara circular isolada da Display List', () => {
  const source = readFileSync(new URL('../src/world/TerrainComposer.js', import.meta.url), 'utf8');
  assert.match(source, /scene\.make\.graphics\(\{ x: 0, y: 0, add: false \}\)/);
  assert.match(source, /fillCircle\(center, center, center - 2\)/);
  assert.match(source, /createGeometryMask\(\)/);
  assert.match(source, /setMask\(circleMask\)/);
  assert.match(source, /add\.tileSprite\(0, 0, diameter, diameter, pattern\.textureKey\)/);
});

test('o oceano ultrapassa a ilha e cobre o limite de câmera no zoom mínimo', () => {
  const source = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  assert.match(source, /const oceanSize = ISLAND_DIAMETER \* 4/);
  assert.match(source, /setDepth\(-1200\)/);
  assert.match(source, /createTerrainLayers/);
  assert.doesNotMatch(source, /syncTerrainLayersToCamera|createCloudBoundary|generated-cloud-sea/);
});

test('Preload continua carregando as três texturas finais', () => {
  const source = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  for (const key of ['terrain-smooth', 'terrain-grass', 'terrain-relief']) assert.ok(source.includes(key));
  assert.doesNotMatch(source, /terreno-01\.png|island-01\.png/);
});
