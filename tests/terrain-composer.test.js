import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('WorldBootstrap monta a ilha com uma textura e mantém a navegação por máscara alfa', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  const game = read('../src/scenes/Game.js');
  assert.match(bootstrap, /const ISLAND_DIAMETER = 4096/);
  assert.match(bootstrap, /scene\.add\.image\([\s\S]*?'island-terrain'/);
  assert.match(bootstrap, /setDisplaySize\(scene\.worldWidth, scene\.worldHeight\)/);
  assert.match(bootstrap, /scene\.navigation\.setAlphaMask\(pixels, maskSize, maskSize, threshold\)/);
  assert.match(game, /new WorldBootstrap\(this\)/);
  assert.doesNotMatch(bootstrap, /createIslandTerrain|setIslandMask\(/);
});

test('Preload carrega a textura única do terreno e mantém oceano e vegetação', () => {
  const preload = read('../src/scenes/Preload.js');
  assert.match(preload, /ilha_terreno\.webp/);
  assert.match(preload, /ocean-pattern-seamless-512\.webp/);
  assert.match(preload, /tree-forest-broad/);
  assert.doesNotMatch(preload, /Terreno_liso|Terreno_moita|Terreno_relevo/);
  assert.match(preload, /ocean-seamless-512-v/);
});

test('Navegação continua usando máscara alfa pré-calculada, sem leitura por frame', () => {
  const navigation = read('../src/world/WorldNavigation.js');
  assert.match(navigation, /setAlphaMask\(rgbaPixels, width, height, threshold = 150\)/);
  assert.match(navigation, /this\.walkableGrid = new Uint8Array/);
  assert.match(navigation, /this\.alphaMask\[py \* this\.maskWidth \+ px\] === 1/);
});

test('Grade caminhável é persistida no IndexedDB e validada por versão, hash e dimensões', () => {
  const bootstrap = read('../src/world/WorldBootstrap.js');
  const game = read('../src/scenes/Game.js');
  const cache = read('../src/world/WalkableGridCache.js');
  assert.match(bootstrap, /await createIslandWalkableMask\(scene\)/);
  assert.match(bootstrap, /getTerrainContentHash\(terrainUrl\)/);
  assert.match(bootstrap, /island-geometry-v1/);
  assert.match(bootstrap, /grid-algorithm-/);
  assert.match(bootstrap, /readWalkableGrid\(cacheId/);
  assert.match(bootstrap, /writeWalkableGrid\(cacheId, scene\.navigation\.walkableGrid\)/);
  assert.match(cache, /indexedDB\.open\(DB_NAME, DB_VERSION\)/);
  assert.match(cache, /crypto\.subtle\.digest\('SHA-256'/);
  assert.match(cache, /algorithmVersion: WALKABLE_GRID_ALGORITHM_VERSION/);
  assert.match(game, /if \(!this\.initialized\) return/);
});

test('WorldNavigation aceita a grade restaurada sem manter a máscara RGBA', () => {
  const navigation = read('../src/world/WorldNavigation.js');
  assert.match(navigation, /setWalkableGrid\(grid\)/);
  assert.match(navigation, /this\.alphaMask = null/);
  assert.match(navigation, /isTerrainWalkableAt\(x, y\)/);
});
