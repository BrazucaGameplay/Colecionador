import test from 'node:test';
import assert from 'node:assert/strict';
import WorldNavigation from '../src/world/WorldNavigation.js';

function rgbaMask(width, height, alpha = 255) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = alpha;
  return pixels;
}

test('máscara alfa produz uma grade caminhável e respeita pixels abaixo do limiar', () => {
  const navigation = new WorldNavigation(240, 240);
  const pixels = rgbaMask(10, 10);
  // A grade valida o centro e os oito pontos de apoio; (5,4) é um
  // pixel efetivamente amostrado pela célula cujo centro está em (108,108).
  pixels[(4 * 10 + 5) * 4 + 3] = 159;
  navigation.setAlphaMask(pixels, 10, 10, 160);

  assert.ok(navigation.walkableGrid instanceof Uint8Array);
  assert.equal(navigation.isTerrainWalkableAt(36, 36), true);
  assert.equal(navigation.isTerrainWalkableAt(108, 108), false);
  assert.equal(navigation.isTerrainWalkableAt(180, 180), true);
});

test('grade restaurada é copiada e substitui a máscara RGBA em memória', () => {
  const navigation = new WorldNavigation(240, 240);
  navigation.setAlphaMask(rgbaMask(10, 10), 10, 10);
  const grid = new Uint8Array(navigation.cols * navigation.rows).fill(1);
  grid[4 * navigation.cols + 4] = 0;
  navigation.setWalkableGrid(grid);
  grid[4 * navigation.cols + 4] = 1;

  assert.equal(navigation.alphaMask, null);
  assert.equal(navigation.isTerrainWalkableAt(108, 108), false);
  assert.equal(navigation.isTerrainWalkableAt(36, 36), true);
});

test('pathfinding contorna células bloqueadas e impede diagonal através de cantos fechados', () => {
  const navigation = new WorldNavigation(240, 240);
  const grid = new Uint8Array(navigation.cols * navigation.rows).fill(1);
  grid[4 * navigation.cols + 4] = 0;
  navigation.setWalkableGrid(grid);

  const path = navigation.findPath(36, 108, 204, 108);
  assert.ok(path.length > 0);
  assert.ok(path.every(point => !(Math.floor(point.x / 24) === 4 && Math.floor(point.y / 24) === 4)));

  const corner = new WorldNavigation(72, 72);
  const cornerGrid = new Uint8Array(corner.cols * corner.rows).fill(1);
  cornerGrid[0 * corner.cols + 1] = 0;
  cornerGrid[1 * corner.cols + 0] = 0;
  corner.setWalkableGrid(cornerGrid);
  assert.deepEqual(corner.findPath(12, 12, 36, 36), []);
});

test('obstáculos elípticos bloqueiam área do personagem e mantêm consultas locais', () => {
  const navigation = new WorldNavigation(480, 480);
  navigation.setWalkableGrid(new Uint8Array(navigation.cols * navigation.rows).fill(1));
  navigation.addObstacle(240, 240, 36, 20);

  assert.equal(navigation.isAreaWalkable(240, 240, 10), false);
  assert.equal(navigation.isAreaWalkable(120, 120, 10), true);
  assert.ok(navigation.getNearbyObstacles(240, 240).length > 0);
});
