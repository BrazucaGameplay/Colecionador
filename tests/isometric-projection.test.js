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
