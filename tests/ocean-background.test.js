import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('oceano usa diretamente o WebP original e cobre a área da câmera', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  readSavedProgress() {'));
  assert.match(method, /this\.add\.tileSprite\(/);
  assert.match(method, /'ocean-pattern'/);
  assert.match(method, /setTilePosition\(view\.x, view\.y\)/);
  assert.doesNotMatch(method, /add\.shader|createCanvas|getImageData|putImageData|drawImage|CanvasTexture|ImageData/);
});

test('oceano usa um TileSprite e sincroniza posição, tamanho e repetição com a câmera', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  readSavedProgress() {'));
  assert.equal((method.match(/this\.add\.tileSprite\(/g) || []).length, 1);
  assert.match(method, /syncOceanBackground\(\)/);
  assert.match(method, /setSize\(view\.width, view\.height\)/);
  assert.match(method, /setTilePosition\(view\.x, view\.y\)/);
});
