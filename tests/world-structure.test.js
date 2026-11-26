import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import WorldDepthManager from '../src/world/WorldDepthManager.js';
import WorldCollisionManager from '../src/world/WorldCollisionManager.js';
import { ISLAND_01_LAYOUT, TREE_SPACING } from '../src/world/map-layout/island-01.js';

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
  assert.equal(ISLAND_01_LAYOUT.length, 217);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-ancestral').length, 1);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-forest-broad').length, 108);
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.assetKey === 'tree-forest-pine').length, 108);
  assert.ok(ISLAND_01_LAYOUT.every(item => !item.id.startsWith('rock-')));
  assert.ok(ISLAND_01_LAYOUT.every(item => !item.id.startsWith('bush-')));
});


test('as árvores formam exatamente três bosques compactos em regiões distintas', () => {
  const counts = Object.fromEntries(['grove-west', 'grove-east', 'grove-south'].map(group => [
    group, ISLAND_01_LAYOUT.filter(item => item.group === group).length
  ]));
  assert.deepEqual(counts, { 'grove-west': 11, 'grove-east': 11, 'grove-south': 10 });
  assert.equal(ISLAND_01_LAYOUT.filter(item => item.id.startsWith('tree-solo-')).length, 184);
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



test('nenhuma árvore fica a mais de 10 metros da árvore vizinha mais próxima', () => {
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
  assert.ok(maximumNearestNeighbor <= TREE_SPACING.maxNeighborWorldUnits,
    'Maior distância até a árvore vizinha: ' + maximumNearestNeighbor);
});

test('tamanhos ampliados seguem a distribuição 10% +80%, 10% +90% e 80% base', () => {
  const trees = ISLAND_01_LAYOUT.filter(item => item.assetKey !== 'tree-ancestral');
  assert.equal(trees.length, 216);
  assert.equal(trees.filter(item => item.sizeTier === 'plus-80').length, 22);
  assert.equal(trees.filter(item => item.sizeTier === 'plus-90').length, 21);
  assert.equal(trees.filter(item => item.sizeTier === 'base').length, 173);
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
  assert.equal(ancestral[0].y, 516);
  assert.equal(ancestral[0].radiusX, 38);
  assert.equal(ancestral[0].radiusY, 32);
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


import { CHARACTER_ANIMATIONS, COMBAT_ANIMATION_SEQUENCE, DEFAULT_CHARACTER_SCALE, DEFAULT_IDLE_ANIMATION, DEFAULT_MOVEMENT_ANIMATION } from '../src/rendering/characters/CharacterAnimationCatalog.js';

test('o protagonista usa os dois pacotes de animação do Release', () => {
  assert.equal(DEFAULT_IDLE_ANIMATION, 'idle');
  assert.equal(DEFAULT_MOVEMENT_ANIMATION, 'walking');
  for (const id of ['idle', 'walking', 'running', 'combat', 'combatSlash', 'jump', 'dying', 'flirtyStrut']) {
    assert.ok(CHARACTER_ANIMATIONS[id], 'Animação ausente: ' + id);
  }
  assert.equal(CHARACTER_ANIMATIONS.walking, CHARACTER_ANIMATIONS.running);
  assert.equal(CHARACTER_ANIMATIONS.idle.clip, 'Idle');
  assert.equal(CHARACTER_ANIMATIONS.running.clip, 'Running');
  assert.equal(CHARACTER_ANIMATIONS.dying.clip, 'Dead');
  assert.equal(CHARACTER_ANIMATIONS.flirtyStrut.clip, 'Flirty_Strut');
  assert.equal(CHARACTER_ANIMATIONS.combat.clip, 'Combate_dd');
  assert.equal(CHARACTER_ANIMATIONS.combatSlash.clip, 'Right_Hand_Sword_Slash');
  assert.equal(CHARACTER_ANIMATIONS.jump.clip, 'Salto');
  assert.equal(CHARACTER_ANIMATIONS.idle.loop, true);
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


test('a escala visual padrão do protagonista foi aumentada sem alterar os quadros', () => {
  assert.equal(DEFAULT_CHARACTER_SCALE, 1.35);
  assert.ok(DEFAULT_CHARACTER_SCALE > 0.95);
});

test('o ataque alterna ciclicamente entre os três movimentos de combate', () => {
  assert.deepEqual(COMBAT_ANIMATION_SEQUENCE, ['combat', 'jump', 'combatSlash']);
  assert.equal(CHARACTER_ANIMATIONS.combat.clip, 'Combate_dd');
  assert.equal(CHARACTER_ANIMATIONS.jump.clip, 'Salto');
  assert.equal(CHARACTER_ANIMATIONS.combatSlash.clip, 'Right_Hand_Sword_Slash');
  assert.equal(CHARACTER_ANIMATIONS.combat.priority, 70);
  assert.equal(CHARACTER_ANIMATIONS.jump.priority, 40);
  assert.equal(CHARACTER_ANIMATIONS.combatSlash.priority, 70);
  const sequence = Array.from({ length: 6 }, (_, index) => COMBAT_ANIMATION_SEQUENCE[index % COMBAT_ANIMATION_SEQUENCE.length]);
  assert.deepEqual(sequence, ['combat', 'jump', 'combatSlash', 'combat', 'jump', 'combatSlash']);
});


test('ações de combate compensam a escala menor dos atlas sem alterar a escala base', () => {
  const source = readFileSync(new URL('../src/rendering/characters/CharacterSpriteRenderer.js', import.meta.url), 'utf8');
  assert.match(source, /this\.actionScaleMultiplier = 1\.35/);
  assert.match(source, /setScale\(this\.baseScale \* this\.actionScaleMultiplier\)/);
  assert.match(source, /setScale\(this\.baseScale\)/);
});
