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


import { getCameraCenterCorrection, getCenteredFrustum, getFramePlacement, getOpaqueBounds } from '../tools/character-baker/frame-grounding.js';

test('limites visíveis medem a área real do personagem', () => {
  const width = 8, height = 10;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 2; y <= 6; y++) for (let x = 1; x <= 4; x++) rgba[(y * width + x) * 4 + 3] = 255;
  assert.deepEqual(getOpaqueBounds(rgba, width, height), { minX: 1, minY: 2, maxX: 4, maxY: 6, width: 4, height: 5 });
  assert.equal(getOpaqueBounds(new Uint8ClampedArray(width * height * 4), width, height), null);
  assert.throws(() => getOpaqueBounds(new Uint8ClampedArray(3), width, height));
});

test('normalização mantém escala comum e linha de chão consistente', () => {
  const bounds = { minX: 4, minY: 8, maxX: 23, maxY: 57, width: 20, height: 50 };
  const maxBounds = { width: 24, height: 60 };
  const placement = getFramePlacement(bounds, maxBounds, 128, 8, 112);
  assert.equal(placement.scale, 112 / 60);
  assert.equal(placement.pivotY, 120 / 128);
  assert.equal(placement.y + placement.height, 120);
  assert.equal(placement.x + placement.width / 2, 64);
  assert.throws(() => getFramePlacement(bounds, maxBounds, 128, 64, 112));
});

test('frustum ortográfico fica centrado no espaço local da câmera', () => {
  assert.deepEqual(getCenteredFrustum(4), { top: 2, bottom: -2 });
  assert.deepEqual(getCenteredFrustum(2.5), { top: 1.25, bottom: -1.25 });
  assert.throws(() => getCenteredFrustum(0));
});

test('correção de câmera recentraliza poses deslocadas pelo root motion', () => {
  const right = getCameraCenterCorrection({ minX: 175, maxX: 255, minY: 90, maxY: 150 }, 256, 6);
  assert.ok(right.x > 0);
  assert.equal(right.y, 0.1875);
  const high = getCameraCenterCorrection({ minX: 98, maxX: 158, minY: 0, maxY: 95 }, 256, 6);
  assert.equal(high.x, 0);
  assert.ok(high.y > 0);
  assert.equal(high.y, 1.88671875);
});
