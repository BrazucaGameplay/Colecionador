import test from 'node:test';
import assert from 'node:assert/strict';
import WorldEntitySyncSystem from '../src/systems/WorldEntitySyncSystem.js';
import { tileToWorld } from '../src/world/IsometricProjection.js';

test('WorldEntitySyncSystem updates the player tile through WorldManager and sorts all entities', () => {
  const metrics = { tileWidth: 64, tileHeight: 32, originX: 544, originY: 16 };
  const playerPosition = tileToWorld({ x: 8, y: 8 }, metrics);
  const monsterPosition = tileToWorld({ x: 12, y: 8 }, metrics);
  const player = { sprite: { ...playerPosition } };
  const monster = { dead: false, sprite: { ...monsterPosition } };
  const writes = [];
  const depths = [];
  const worldManager = {
    isWalkable(x, y) { return x >= 0 && y >= 0 && x < 30 && y < 17; },
    setPlayerBodyTile(tile) { writes.push(tile); return true; }
  };
  const depthSorting = {
    setWorldDepth(sprite, position) { depths.push({ sprite, position }); }
  };
  const system = new WorldEntitySyncSystem({
    player,
    monsters: [monster],
    worldManager,
    metrics,
    depthSorting
  });

  system.update();
  assert.deepEqual(writes, [{ x: 8, y: 8 }]);
  assert.equal(depths.length, 2);
  assert.deepEqual(depths[0].position, playerPosition);
  assert.deepEqual(depths[1].position, monsterPosition);
});

test('WorldEntitySyncSystem does not write an invalid player tile', () => {
  const metrics = { tileWidth: 64, tileHeight: 32 };
  const player = { sprite: { x: -1000, y: -1000 } };
  let writes = 0;
  const system = new WorldEntitySyncSystem({
    player,
    worldManager: {
      isWalkable: () => false,
      setPlayerBodyTile: () => { writes += 1; }
    },
    metrics,
    depthSorting: { setWorldDepth() {} }
  });

  system.update();
  assert.equal(writes, 0);
});
