import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('oceano usa diretamente o WebP original sem modificar pixels ou criar texturas', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  syncOceanBackground() {'));
  assert.match(method, /'ocean-pattern'/);
  assert.match(method, /this\.add\.tileSprite\(/);
  assert.doesNotMatch(method, /createCanvas|getImageData|putImageData|drawImage|Uint8ClampedArray|ImageData|refresh\(|setTileScale|seamless/);
  assert.doesNotMatch(game, /ocean-pattern-seamless/);
});

test('ocean background mantém um único TileSprite e invalida cache anterior', () => {
  const preload = read('../src/scenes/Preload.js');
  const game = read('../src/scenes/Game.js');
  assert.match(preload, /ocean-original-v31/);
  assert.equal((game.match(/this\.add\.tileSprite\(/g) || []).length, 1);
  assert.match(game, /syncOceanBackground\(\)/);
});
