import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('o terreno e o mundo jogável continuam em 4096 x 4096', () => {
  const game = read('../src/scenes/Game.js');
  assert.match(game, /const ISLAND_DIAMETER = 4096/);
  assert.match(game, /this\.worldWidth = ISLAND_DIAMETER/);
  assert.match(game, /this\.worldHeight = ISLAND_DIAMETER/);
  assert.match(game, /this\.physics\.world\.setBounds\(0, 0, this\.worldWidth, this\.worldHeight\)/);
  assert.match(game, /new WorldNavigation\(this\.worldWidth, this\.worldHeight\)/);
});

test('oceano tem limite próprio e margem simétrica de 512 unidades a partir da costa', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  createOceanBackground() {'), game.indexOf('  readSavedProgress() {'));
  assert.match(game, /const OCEAN_MARGIN = 512/);
  assert.match(game, /const OCEAN_RADIUS = ISLAND_SHAPE\.baseRadius \+ OCEAN_MARGIN/);
  assert.match(method, /width: diameter/);
  assert.match(method, /height: diameter/);
  assert.match(method, /ISLAND_SHAPE\.centerX - OCEAN_RADIUS/);
  assert.match(method, /ISLAND_SHAPE\.centerY - OCEAN_RADIUS/);
  assert.match(method, /this\.add\.tileSprite\(/);
  assert.match(method, /'ocean-pattern'/);
  assert.match(game, /camera\.setBounds\(this\.oceanBounds\.x, this\.oceanBounds\.y, this\.oceanBounds\.width, this\.oceanBounds\.height\)/);
  assert.doesNotMatch(method, /add\.shader|createCanvas|getImageData|putImageData|drawImage|CanvasTexture|ImageData/);
});

test('oceano é estático e não acompanha a câmera a cada frame', () => {
  const game = read('../src/scenes/Game.js');
  assert.equal((game.match(/this\.add\.tileSprite\(/g) || []).length, 1);
  assert.doesNotMatch(game, /syncOceanBackground/);
});
