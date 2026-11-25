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


import { CHARACTER_ANIMATIONS, DEFAULT_IDLE_ANIMATION, DEFAULT_MOVEMENT_ANIMATION } from '../src/rendering/characters/CharacterAnimationCatalog.js';

test('o protagonista possui um catálogo único de animações independentes', () => {
  assert.equal(DEFAULT_IDLE_ANIMATION, 'idle');
  assert.equal(DEFAULT_MOVEMENT_ANIMATION, 'walking');
  for (const id of ['idle', 'walking', 'running', 'combat', 'jump', 'dying', 'handstand', 'runningVariant', 'specialD']) {
    assert.ok(CHARACTER_ANIMATIONS[id], 'Animação ausente: ' + id);
  }
  assert.equal(CHARACTER_ANIMATIONS.idle.loop, true);
  assert.equal(CHARACTER_ANIMATIONS.walking.loop, true);
  assert.equal(CHARACTER_ANIMATIONS.running.loop, true);
  assert.equal(CHARACTER_ANIMATIONS.combat.loop, false);
  assert.equal(CHARACTER_ANIMATIONS.jump.loop, false);
  assert.equal(CHARACTER_ANIMATIONS.dying.returnToLocomotion, false);
});

test('cada pacote catalogado possui PNG e JSON correspondentes', async () => {
  const { access } = await import('node:fs/promises');
  for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
    await access(new URL(`../public/${animation.path}.png`, import.meta.url));
    await access(new URL(`../public/${animation.path}.json`, import.meta.url));
  }
});


import { findOpaqueBottomRow, findOpaqueTopRow, getGroundedFitY, getOpaqueBottomPivot } from '../tools/character-baker/frame-grounding.js';

test('enquadramento compensa deslocamento vertical de raiz sem alterar a posição do mundo', () => {
  assert.equal(getGroundedFitY(0.42, -0.35), 0.77);
  assert.equal(getGroundedFitY(0.42, 0.35), 0.07);
  assert.throws(() => getGroundedFitY(Number.NaN, 0));
});

test('pivô acompanha o último pixel visível e rejeita quadros cortados', () => {
  const width = 4;
  const height = 10;
  const rgba = new Uint8ClampedArray(width * height * 4);
  rgba[(6 * width + 1) * 4 + 3] = 255;
  assert.equal(findOpaqueBottomRow(rgba, width, height), 6);
  assert.equal(findOpaqueTopRow(rgba, width, height), 6);
  assert.equal(getOpaqueBottomPivot(6, height), 0.7);
  assert.equal(getOpaqueBottomPivot(-1, height), 0.84);
  assert.throws(() => getOpaqueBottomPivot(9, height), /borda inferior/);
  assert.throws(() => findOpaqueBottomRow(new Uint8ClampedArray(3), width, height));
});
