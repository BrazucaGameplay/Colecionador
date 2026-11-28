import test from 'node:test';
import assert from 'node:assert/strict';
import WorldDepthManager from '../src/world/WorldDepthManager.js';
import WorldCollisionManager from '../src/world/WorldCollisionManager.js';
import { ISLAND_01_LAYOUT, TREE_SPACING } from '../src/world/map-layout/island-01.js';
import { getActionDisplayScale } from '../src/rendering/characters/CharacterSpriteScale.js';

test('layout da floresta usa dois tipos de árvores, coordenadas fixas e uma ancestral', () => {
  const ids = new Set();
  const validAssets = new Set(['tree-forest-broad', 'tree-forest-pine', 'tree-ancestral']);
  for (const item of ISLAND_01_LAYOUT) {
    assert.ok(item.id && !ids.has(item.id), 'ID ausente ou duplicado: ' + item.id);
    ids.add(item.id);
    assert.ok(validAssets.has(item.assetKey), 'Asset não carregado no Preload: ' + item.assetKey);
    assert.ok(Number.isFinite(item.x) && item.x > 0 && item.x < 4096);
    assert.ok(Number.isFinite(item.y) && item.y > 0 && item.y < 4096);
    assert.ok(item.targetHeight > 0);
    assert.ok(item.collision?.radiusX > 0 && item.collision?.radiusY > 0, 'Colisão de tronco ausente: ' + item.id);
  }
  assert.equal(ISLAND_01_LAYOUT.length, 85);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-ancestral').length, 1);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-forest-broad').length, 44);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-forest-pine').length, 40);
  assert.ok(ISLAND_01_LAYOUT.every(item => !item.id.startsWith('rock-')));
  assert.ok(ISLAND_01_LAYOUT.every(item => !item.id.startsWith('bush-')));
});


test('as árvores formam exatamente três bosques compactos em regiões distintas', () => {
  const counts = Object.fromEntries(['grove-west', 'grove-east', 'grove-south'].map(group => [
    group, ISLAND_01_LAYOUT.filter(item => item.group === group).length
  ]));
  assert.deepEqual(counts, { 'grove-west': 6, 'grove-east': 7, 'grove-south': 6 });
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.id.startsWith('tree-solo-')).length, 65);
  const centers = Object.entries(counts).map(([group]) => {
    const trees = ISLAND_01_LAYOUT.filter(item => item.group === group);
    return {
      group,
      x: trees.reduce((sum, tree) => sum + tree.x, 0) / trees.length,
      y: trees.reduce((sum, tree) => sum + tree.y, 0) / trees.length
    };
  });
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      assert.ok(Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y) > 900);
    }
  }
});



test('a distribuição reduzida mantém vizinhas próximas por toda a ilha', () => {
  const trees = ISLAND_01_LAYOUT;
  let maximumNearestNeighbor = 0;
  for (let i = 0; i < trees.length; i++) {
    let nearest = Infinity;
    for (let j = 0; j < trees.length; j++) {
      if (i === j) continue;
      nearest = Math.min(nearest, Math.hypot(trees[i].x - trees[j].x, trees[i].y - trees[j].y));
    }
    maximumNearestNeighbor = Math.max(maximumNearestNeighbor, nearest);
  }
  assert.equal(TREE_SPACING.maxNeighborWorldUnits, 300);
  assert.ok(maximumNearestNeighbor <= 480,
    'Maior distância após a redução: ' + maximumNearestNeighbor);
});

test('tamanhos ampliados seguem a distribuição 10% +80%, 10% +90% e 80% base', () => {
  const trees = ISLAND_01_LAYOUT.filter(item => item.assetKey !== 'tree-ancestral');
  assert.equal(trees.length, 84);
  assert.equal(trees.filter(item => item.sizeTier === 'plus-80').length, 8);
  assert.equal(trees.filter(item => item.sizeTier === 'plus-90').length, 8);
  assert.equal(trees.filter(item => item.sizeTier === 'base').length, 68);
  for (const tree of trees) {
    const factor = tree.sizeTier === 'plus-80' ? 1.8 : tree.sizeTier === 'plus-90' ? 1.9 : 1;
    const baseRadius = tree.assetKey === 'tree-forest-broad' ? 31 : 29;
    assert.equal(tree.collision.radiusX, Math.round(baseRadius * factor));
  }
});


test('estruturas principais deixam a área inicial livre', () => {
  const center = 2048;
  for (const item of ISLAND_01_LAYOUT) {
    const distance = Math.hypot(item.x - center, item.y - center);
    assert.ok(distance > 320, item.id + ' invade a área central de início.');
  }
});


test('cada árvore registra colisão fixa do tronco na navegação', () => {
  const obstacles = [];
  const navigation = { addObstacle: (...args) => obstacles.push(args) };
  const collisions = new WorldCollisionManager(navigation);
  for (const item of ISLAND_01_LAYOUT) collisions.register(item);
  assert.equal(obstacles.length, ISLAND_01_LAYOUT.length);
  const ancestral = collisions.registrations.filter(item => item.id === 'tree-ancestral-north');
  assert.equal(ancestral.length, 1);
  assert.equal(ancestral[0].x, 2048);
  assert.equal(ancestral[0].y, 714);
  assert.equal(ancestral[0].radiusX, 57);
  assert.equal(ancestral[0].radiusY, 48);
  assert.throws(() => collisions.register(ISLAND_01_LAYOUT[0]), /Colisão duplicada/);
  collisions.destroy();
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


import { CHARACTER_ANIMATIONS, DEFAULT_CHARACTER_SCALE, DEFAULT_IDLE_ANIMATION, DEFAULT_MOVEMENT_ANIMATION } from '../src/rendering/characters/CharacterAnimationCatalog.js';

test('o protagonista possui exatamente quatro animações', () => {
  assert.equal(DEFAULT_IDLE_ANIMATION, 'idle');
  assert.equal(DEFAULT_MOVEMENT_ANIMATION, 'running');
  assert.deepEqual(Object.keys(CHARACTER_ANIMATIONS), ['idle', 'running', 'combat', 'dying']);
  assert.equal(CHARACTER_ANIMATIONS.idle.clip, 'Idle');
  assert.equal(CHARACTER_ANIMATIONS.running.clip, 'Running');
  assert.equal(CHARACTER_ANIMATIONS.combat.clip, 'Combate_dd');
  assert.equal(CHARACTER_ANIMATIONS.dying.clip, 'Dead');
  assert.equal(CHARACTER_ANIMATIONS.idle.loop, true);
  assert.equal(CHARACTER_ANIMATIONS.running.loop, true);
  assert.equal(CHARACTER_ANIMATIONS.combat.loop, false);
  assert.equal(CHARACTER_ANIMATIONS.dying.returnToLocomotion, false);
});

test('cada um dos quatro pacotes possui PNG e JSON correspondentes', async () => {
  const { access } = await import('node:fs/promises');
  for (const animation of Object.values(CHARACTER_ANIMATIONS)) {
    await access(new URL(`../public/${animation.path}.png`, import.meta.url));
    await access(new URL(`../public/${animation.path}.json`, import.meta.url));
  }
});

test('a escala visual padrão do protagonista foi aumentada sem alterar os quadros', () => {
  assert.equal(DEFAULT_CHARACTER_SCALE, 1.35);
  assert.ok(DEFAULT_CHARACTER_SCALE > 0.95);
});

test('escala de apresentação de ação deriva da escala base sem mutá-la', () => {
  const baseScale = DEFAULT_CHARACTER_SCALE;
  assert.equal(getActionDisplayScale(baseScale), baseScale * 1.35);
  assert.equal(baseScale, DEFAULT_CHARACTER_SCALE);
  assert.equal(getActionDisplayScale(1.2, 1.5), 1.8);
  assert.equal(getActionDisplayScale(Number.NaN), 0);
});
