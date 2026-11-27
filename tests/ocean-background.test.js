import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('o terreno e o mundo jogável continuam em 4096 x 4096', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  assert.match(bootstrap, /const ISLAND_DIAMETER = 4096/);
  assert.match(bootstrap, /scene\.worldWidth = ISLAND_DIAMETER/);
  assert.match(bootstrap, /scene\.worldHeight = ISLAND_DIAMETER/);
  assert.match(bootstrap, /scene\.physics\.world\.setBounds\(0, 0, scene\.worldWidth, scene\.worldHeight\)/);
  assert.match(bootstrap, /new WorldNavigation\(scene\.worldWidth, scene\.worldHeight\)/);
});

test('oceano mantém a margem costeira e expande a dimensão maior para a proporção da tela', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  const camera = read('../src/systems/camera/CameraController.js');
  const method = bootstrap.slice(bootstrap.indexOf('function updateOceanBounds('), bootstrap.indexOf('function createOceanBackground('));
  assert.match(bootstrap, /const OCEAN_MARGIN = 256/);
  assert.match(bootstrap, /const OCEAN_RADIUS = ISLAND_SHAPE\.baseRadius \+ OCEAN_MARGIN/);
  assert.match(method, /const baseDiameter = OCEAN_RADIUS \* 2/);
  assert.match(method, /const aspect = Math\.max\(0\.1, viewWidth \/ Math\.max\(1, viewHeight\)\)/);
  assert.match(method, /viewWidth \/ MIN_CAMERA_ZOOM \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(method, /viewHeight \/ MIN_CAMERA_ZOOM \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(bootstrap, /scene\.add\.tileSprite\(/);
  assert.match(bootstrap, /'ocean-pattern'/);
  assert.match(camera, /this\.camera\.setBounds\(bounds\.x, bounds\.y, bounds\.width, bounds\.height\)/);
});

test('resize atualiza viewport das duas câmeras e redimensiona o oceano', () => {
  const camera = read('../src/systems/camera/CameraController.js');
  assert.match(camera, /this\.camera\.setViewport\(0, 0, width, height\)/);
  assert.match(camera, /this\.uiCamera\.setViewport\(0, 0, width, height\)/);
  assert.match(camera, /scene\.worldBootstrap\.updateOceanBounds\(width, height\)/);
  assert.match(camera, /this\.camera\.setBounds\(bounds\.x, bounds\.y, bounds\.width, bounds\.height\)/);
  assert.match(camera, /this\.getMinimumZoom\(\)/);
});

test('oceano permanece em um único TileSprite, sem processamento por frame', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  assert.equal((bootstrap.match(/scene\.add\.tileSprite\(/g) || []).length, 1);
  assert.doesNotMatch(bootstrap, /syncOceanBackground/);
});

test('limites visuais do oceano reservam espaço para arraste no zoom mínimo', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  const camera = read('../src/systems/camera/CameraController.js');
  assert.match(bootstrap, /const OCEAN_PAN_BUFFER_FACTOR = 1\.15/);
  assert.match(bootstrap, /viewWidth \/ MIN_CAMERA_ZOOM \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(bootstrap, /viewHeight \/ MIN_CAMERA_ZOOM \* OCEAN_PAN_BUFFER_FACTOR/);
  assert.match(camera, /getMinimumZoom\(\) \{ return CAMERA_ZOOM\.min; \}/);
  assert.match(bootstrap, /\* OCEAN_PAN_BUFFER_FACTOR/);
});

test('limites de zoom usam mínimo 0.2x, inicial 0.4x e máximo 0.6x', () => {
  const camera = read('../src/systems/camera/CameraController.js');
  assert.match(camera, /CAMERA_ZOOM = Object\.freeze\(\{ min: 0\.2, max: 0\.6, default: 0\.4 \}\)/);
  assert.match(camera, /this\.camera\.setZoom\(Math\.max\(this\.getMinimumZoom\(\), CAMERA_ZOOM\.default\)\)/);
});
