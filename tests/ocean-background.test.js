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
  assert.match(game, /createIslandNavigation\(\{/);
  const factory = read('../src/world/navigation/IslandNavigationFactory.js');
  assert.match(factory, /new WorldNavigation\(width, height\)/);
});

test('oceano mantém a margem costeira e expande a dimensão maior para a proporção da tela', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  updateOceanBounds('), game.indexOf('  readSavedProgress() {'));
  assert.match(game, /const OCEAN_MARGIN = 256/);
  assert.match(game, /const OCEAN_RADIUS = ISLAND_SHAPE\.baseRadius \+ OCEAN_MARGIN/);
  assert.match(method, /const baseDiameter = OCEAN_RADIUS \* 2/);
  assert.match(method, /const aspect = Math\.max\(0\.1, viewWidth \/ Math\.max\(1, viewHeight\)\)/);
  assert.match(method, /viewWidth \/ CAMERA_ZOOM\.min \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(method, /viewHeight \/ CAMERA_ZOOM\.min \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(method, /Math\.max\(/);
  assert.match(method, /this\.add\.tileSprite\(/);
  assert.match(method, /'ocean-pattern'/);
  assert.match(game, /camera\.setBounds\(\s*this\.oceanBounds\.x/);
});

test('resize atualiza viewport das duas câmeras e redimensiona o oceano', () => {
  const game = read('../src/scenes/Game.js');
  const method = game.slice(game.indexOf('  resizeHudCamera('), game.indexOf('  createGround() {'));
  assert.match(method, /this\.camera\.setViewport\(0, 0, width, height\)/);
  assert.match(method, /this\.uiCamera\.setViewport\(0, 0, width, height\)/);
  assert.match(method, /this\.updateOceanBounds\(width, height\)/);
  assert.match(method, /this\.camera\.setBounds\(/);
  assert.match(method, /this\.getMinimumCameraZoom\(\)/);
});

test('oceano permanece em um único TileSprite, sem processamento por frame', () => {
  const game = read('../src/scenes/Game.js');
  assert.equal((game.match(/this\.add\.tileSprite\(/g) || []).length, 1);
  assert.doesNotMatch(game, /syncOceanBackground/);
});


test('limites visuais do oceano reservam espaço para arraste no zoom mínimo', () => {
  const game = read('../src/scenes/Game.js');
  assert.match(game, /const OCEAN_PAN_BUFFER_FACTOR = 1\.15/);
  assert.match(game, /viewWidth \/ CAMERA_ZOOM\.min \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(game, /viewHeight \/ CAMERA_ZOOM\.min \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(game, /return CAMERA_ZOOM\.min/);
  assert.match(game, /\* OCEAN_PAN_BUFFER_FACTOR/);
});

test('limites de zoom usam mínimo 0.2x, inicial 0.4x e máximo 0.6x', () => {
  const game = read('../src/scenes/Game.js');
  assert.match(game, /CAMERA_ZOOM = Object\.freeze\(\{ min: 0\.2, max: 0\.6, default: 0\.4 \}\)/);
  assert.match(game, /this\.camera\.setZoom\(Math\.max\(this\.getMinimumCameraZoom\(\), CAMERA_ZOOM\.default\)\)/);
});
