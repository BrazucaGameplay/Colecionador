import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Game renderiza a ilha inteira com uma única textura e preserva o mundo lógico', () => {
  const game = read('../src/scenes/Game.js');
  assert.match(game, /const ISLAND_DIAMETER = 4096/);
  assert.match(game, /this\.add\.image\([\s\S]*?'island-terrain'/);
  assert.match(game, /setDisplaySize\(this\.worldWidth, this\.worldHeight\)/);
  assert.match(game, /createIslandNavigation\(\{/);
  assert.doesNotMatch(game, /createIslandTerrain|setIslandMask\(/);
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

test('a cena não depende de rede ou armazenamento para preparar a navegação', () => {
  const game = read('../src/scenes/Game.js');
  const factory = read('../src/world/navigation/IslandNavigationFactory.js');
  const extractor = read('../src/world/navigation/TerrainMaskExtractor.js');
  assert.doesNotMatch(game, /await |fetch\(|indexedDB|WalkableGridCache|createIslandWalkableMask/);
  assert.match(factory, /new WorldNavigation\(width, height\)/);
  assert.match(factory, /extractTerrainPixels\(terrainSource/);
  assert.match(factory, /navigation\.setAlphaMask/);
  assert.match(extractor, /getImageData/);
  assert.doesNotMatch(extractor, /fetch\(|indexedDB|localStorage/);
  assert.match(game, /if \(!this\.initialized\) return/);
});

test('WorldNavigation aceita a grade restaurada sem manter a máscara RGBA', () => {
  const navigation = read('../src/world/WorldNavigation.js');
  assert.match(navigation, /setWalkableGrid\(grid\)/);
  assert.match(navigation, /this\.alphaMask = null/);
  assert.match(navigation, /isTerrainWalkableAt\(x, y\)/);
});
