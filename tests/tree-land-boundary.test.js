import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTreesToIslandLand, isTreeFullyInsideLand } from '../src/world/filter-trees-to-island-land.js';

const textures = {
  get: () => ({ getSourceImage: () => ({ width: 256, height: 256 }) })
};
const tree = (id, x, y, targetHeight = 200) => ({ id, assetKey: 'tree', x, y, targetHeight });

test('árvores que invadem o limite da ilha são removidas sem reposicionar as demais', () => {
  const layout = [tree('inside', 500, 500), tree('edge', 980, 500), tree('outside', 1200, 500)];
  const navigation = {
    isInsideIsland: (x, y) => x >= 0 && y >= 0 && x <= 1000 && y <= 1000
  };
  const kept = filterTreesToIslandLand(layout, navigation, textures, 0);
  assert.deepEqual(kept.map(item => item.id), ['inside']);
  assert.equal(kept[0].x, 500);
  assert.equal(kept[0].y, 500);
});

test('a margem de segurança remove árvores próximas à costa', () => {
  const navigation = { isInsideIsland: (x, y) => x <= 1000 && x >= 0 && y >= 0 && y <= 1000 };
  assert.equal(isTreeFullyInsideLand(tree('near-edge', 900, 500), navigation, textures, 80), false);
  assert.equal(isTreeFullyInsideLand(tree('interior', 500, 500), navigation, textures, 80), true);
});

test('não tenta instanciar árvore sem textura ou máscara de terreno', () => {
  assert.equal(isTreeFullyInsideLand(tree('missing', 500, 500), null, textures), false);
  assert.equal(isTreeFullyInsideLand(tree('missing', 500, 500), { isInsideIsland: () => true }, { get: () => null }), false);
});
