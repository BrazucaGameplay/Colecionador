import test from 'node:test';
import assert from 'node:assert/strict';
import { tileToWorld, worldToTile, depthForTile } from '../src/world/IsometricProjection.js';

const metrics = { tileWidth: 64, tileHeight: 32, originX: 100, originY: 50 };

test('isometric projection maps tile coordinates to diamond-grid world coordinates', () => {
  assert.deepEqual(tileToWorld({ x: 1, y: 0 }, metrics), { x: 132, y: 66 });
  assert.deepEqual(tileToWorld({ x: 0, y: 1 }, metrics), { x: 68, y: 66 });
  assert.deepEqual(tileToWorld({ x: 1, y: 1 }, metrics), { x: 100, y: 82 });
});

test('isometric projection converts world positions back to tile coordinates', () => {
  const original = { x: 12, y: 7 };
  const world = tileToWorld(original, metrics);
  assert.deepEqual(worldToTile(world, metrics), original);
});

test('isometric projection can return fractional tile coordinates for hit testing', () => {
  const point = tileToWorld({ x: 2.5, y: 1.25 }, metrics);
  const tile = worldToTile(point, metrics, { round: false });
  assert.ok(Math.abs(tile.x - 2.5) < 1e-10);
  assert.ok(Math.abs(tile.y - 1.25) < 1e-10);
});

test('isometric depth sorting follows diagonal rows with deterministic tie-break', () => {
  assert.ok(depthForTile({ x: 2, y: 3 }) > depthForTile({ x: 1, y: 3 }));
  assert.ok(depthForTile({ x: 1, y: 4 }) > depthForTile({ x: 1, y: 3 }));
});

test('isometric projection rejects invalid metrics', () => {
  assert.throws(() => tileToWorld({ x: 0, y: 0 }, { tileWidth: 0, tileHeight: 32 }), TypeError);
  assert.throws(() => worldToTile({ x: 0, y: 0 }, null), TypeError);
});

import IsometricMapRenderer from '../src/world/IsometricMapRenderer.js';
import DepthSortingSystem from '../src/world/DepthSortingSystem.js';

function createRenderScene() {
  const images = [];
  return {
    images,
    add: {
      image(x, y, texture) {
        const image = {
          x, y, texture, destroyed: false,
          setOrigin() { return this; },
          setDisplaySize(width, height) { this.width = width; this.height = height; return this; },
          setDepth(depth) { this.depth = depth; return this; },
          destroy() { this.destroyed = true; }
        };
        images.push(image);
        return image;
      }
    }
  };
}

test('IsometricMapRenderer positions and depth-sorts map tiles', () => {
  const scene = createRenderScene();
  const renderer = new IsometricMapRenderer(scene, { tileWidth: 64, tileHeight: 32 });
  const rendered = renderer.render([
    { x: 1, y: 1, texture: 'grass' },
    { x: 0, y: 0, texture: 'grass' }
  ]);

  assert.equal(rendered.length, 2);
  assert.deepEqual(rendered.map(item => item.texture), ['grass', 'grass']);
  assert.equal(rendered[0].x, 0);
  assert.equal(rendered[0].y, 0);
  assert.equal(rendered[1].x, 0);
  assert.equal(rendered[1].y, 32);
  assert.ok(rendered[1].depth > rendered[0].depth);
});

test('IsometricMapRenderer clears previous objects before rerendering', () => {
  const scene = createRenderScene();
  const renderer = new IsometricMapRenderer(scene, { tileWidth: 64, tileHeight: 32 });
  const first = renderer.render([{ x: 0, y: 0, texture: 'grass' }])[0];
  renderer.render([{ x: 1, y: 0, texture: 'stone' }]);

  assert.equal(first.destroyed, true);
  assert.equal(renderer.objects.length, 1);
  assert.equal(renderer.objects[0].texture, 'stone');
});

test('DepthSortingSystem applies projected tile depth to entities', () => {
  const sorter = new DepthSortingSystem();
  const object = { depth: 0, setDepth(value) { this.depth = value; return this; } };

  assert.equal(sorter.setTileDepth(object, { x: 2, y: 3 }), object);
  assert.ok(object.depth > 5);
  sorter.setWorldDepth(object, tileToWorld({ x: 2, y: 3 }, metrics), metrics);
  assert.ok(Math.abs(object.depth - depthForTile({ x: 2, y: 3 })) < 1e-10);
});

test('IsometricMapRenderer rejects invalid tile records', () => {
  const renderer = new IsometricMapRenderer(createRenderScene(), { tileWidth: 64, tileHeight: 32 });
  assert.throws(() => renderer.render([{ x: 0, y: 0 }]), TypeError);
  assert.equal(renderer.objects.length, 0);
});

import WorldManager from '../src/world/WorldManager.js';

test('WorldManager exposes guarded world APIs and renders only in-bounds visual tiles', () => {
  const scene = createRenderScene();
  const world = new WorldManager({
    scene,
    width: 4,
    height: 4,
    blockedTiles: [{ x: 1, y: 1 }],
    playerBodyTile: { x: 0, y: 0 },
    tileWidth: 64,
    tileHeight: 32
  });

  assert.equal(world.core, undefined);
  assert.equal(world.renderer, undefined);
  assert.equal(world.isWalkable(1, 1), false);
  assert.deepEqual(world.getPlayerBodyTile(), { x: 0, y: 0 });
  assert.equal(world.setPlayerBodyTile({ x: 1, y: 1 }), false);
  assert.equal(world.setPlayerBodyTile({ x: 2, y: 2 }), true);
  assert.equal(world.render([{ x: 2, y: 1, texture: 'grass' }]).length, 1);
  assert.throws(() => world.render([{ x: 4, y: 0, texture: 'grass' }]), RangeError);

  world.destroy();
  assert.equal(scene.images[0].destroyed, true);
});
