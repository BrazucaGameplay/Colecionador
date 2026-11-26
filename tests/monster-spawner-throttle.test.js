import test from 'node:test';
import assert from 'node:assert/strict';
import MonsterManager from '../src/systems/monsters/MonsterManager.js';

test('spawner verifica zonas a cada 500 ms, não em todos os frames', () => {
  const manager = Object.create(MonsterManager.prototype);
  let calls = 0;
  manager.destroyed = false;
  manager.spawner = { update() { calls++; } };
  manager.spawnerCheckIntervalMs = 500;
  manager.nextSpawnerCheckAt = 0;
  manager.updateActivation = () => {};
  manager.updateVisibility = () => {};
  manager.playerBody = { player: { x: 0, y: 0 } };
  manager.activeEntries = new Set();
  manager.entries = new Map();
  manager.update(0, 16);
  manager.update(16, 16);
  manager.update(32, 16);
  manager.update(250, 16);
  assert.equal(calls, 1);
  manager.update(500, 16);
  assert.equal(calls, 2);
});
