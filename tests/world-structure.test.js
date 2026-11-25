import test from 'node:test';
import assert from 'node:assert/strict';
import WorldDepthManager from '../src/world/WorldDepthManager.js';
import { ISLAND_01_LAYOUT } from '../src/world/map-layout/island-01.js';

test('layout da ilha possui IDs únicos e assets válidos', () => {
  const ids = new Set();
  const validAssets = new Set(['tree-large', 'tree-flowering', 'rock-cluster']);
  for (const item of ISLAND_01_LAYOUT) {
    assert.ok(item.id && !ids.has(item.id), 'ID ausente ou duplicado: ' + item.id);
    ids.add(item.id);
    assert.ok(validAssets.has(item.assetKey), 'Asset não carregado no Preload: ' + item.assetKey);
    assert.ok(Number.isFinite(item.x) && item.x > 0 && item.x < 4096);
    assert.ok(Number.isFinite(item.y) && item.y > 0 && item.y < 4096);
    assert.ok(item.targetHeight > 0);
    if (item.collision) {
      assert.ok(item.collision.radiusX > 0);
      assert.ok(item.collision.radiusY > 0);
    }
  }
  assert.equal(ISLAND_01_LAYOUT.length, 36);
});

test('estruturas principais deixam a área inicial livre', () => {
  const center = 2048;
  for (const item of ISLAND_01_LAYOUT) {
    const distance = Math.hypot(item.x - center, item.y - center);
    assert.ok(distance > 320, item.id + ' invade a área central de início.');
  }
});

test('profundidade respeita o ponto de apoio e desempata personagem acima da estrutura', () => {
  const depth = new WorldDepthManager();
  const structure = depth.getDepth(1000, 'structure');
  const actorAtSameFoot = depth.getDepth(1000, 'actor');
  const actorBelow = depth.getDepth(1001, 'actor');
  const actorAbove = depth.getDepth(999, 'actor');

  assert.ok(actorAtSameFoot > structure);
  assert.ok(actorBelow > structure);
  assert.ok(actorAbove < structure);
  assert.throws(() => depth.getDepth(Number.NaN, 'actor'));
});
