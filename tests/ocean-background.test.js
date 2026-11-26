import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('oceano suaviza emendas com shader GPU sem alterar o WebP original', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  readSavedProgress() {'));
  assert.match(method, /this\.add\.shader\(/);
  assert.match(method, /sampleHorizontal/);
  assert.match(method, /sampleSeamless/);
  assert.match(method, /uBlendWidth/);
  assert.match(method, /0\.055/);
  assert.match(method, /\['ocean-pattern'\]/);
  assert.doesNotMatch(method, /createCanvas|getImageData|putImageData|drawImage|Uint8ClampedArray|ImageData|CanvasTexture/);
});

test('oceano usa um único Shader e mantém fallback sem processar a textura', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  readSavedProgress() {'));
  assert.match(method, /tilesprite-fallback/);
  assert.match(method, /syncOceanBackground\(\)/);
  assert.equal((method.match(/this\.add\.shader\(/g) || []).length, 1);
  assert.equal((method.match(/this\.add\.tileSprite\(/g) || []).length, 1);
});
