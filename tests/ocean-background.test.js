import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('oceano usa offset tiling e uma textura composta apenas uma vez', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  syncOceanBackground() {'));
  assert.match(method, /ocean-pattern-seamless-v2/);
  assert.equal((method.match(/context\.drawImage\(source/g) || []).length, 4);
  assert.match(method, /getImageData\(0, 0, width, height\)/);
  assert.match(method, /canvasTexture\.refresh\(\)/);
  assert.match(method, /setTileScale\(1\.65, 1\.65\)/);
  assert.doesNotMatch(method, /new Uint8ClampedArray\(original\);\s*const output = new Uint8ClampedArray\(original\);\s*const band = Math\.max/);
});

test('a textura do oceano é invalidada no cache e mantém um único TileSprite', () => {
  const preload = read('../src/scenes/Preload.js');
  const game = read('../src/scenes/Game.js');
  assert.match(preload, /ocean-seamless-v\\d+/);
  assert.equal((game.match(/this\.add\.tileSprite\(/g) || []).length, 1);
  assert.match(game, /syncOceanBackground\(\)/);
});
