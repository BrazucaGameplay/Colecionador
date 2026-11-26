import test from 'node:test';
import assert from 'node:assert/strict';
import WorldDepthManager from '../src/world/WorldDepthManager.js';
import MonsterManager from '../src/systems/monsters/MonsterManager.js';

test('WorldDepthManager não agenda depth sort quando a profundidade não muda', () => {
  const manager = new WorldDepthManager();
  const object = {
    depth: 0,
    calls: 0,
    setDepth(value) { this.depth = value; this.calls++; return this; }
  };
  assert.equal(manager.apply(object, 10, 'actor'), 1030);
  assert.equal(manager.apply(object, 10, 'actor'), 1030);
  assert.equal(object.calls, 1);
  manager.apply(object, 11, 'actor');
  assert.equal(object.calls, 2);
});

test('estados visuais e ociosos não criam IA, física nem entram na simulação', () => {
  const manager = Object.create(MonsterManager.prototype);
  manager.navigation = {};
  manager.activeEntries = new Set();
  manager.combatEntries = new Set();
  manager.targetEntities = [];
  manager.updateTargetMembership = MonsterManager.prototype.updateTargetMembership;
  const entry = {
    entity: { id: 'static-monster', moving: false, setMoving(value) { this.moving = value; } },
    mode: 'dormant',
    behavior: null,
    renderer: {
      setShadowEnabled() {},
      play() {}
    }
  };
  manager.setEntryMode(entry, 'visual', 0);
  assert.equal(entry.behavior, null);
  assert.equal(entry.body, undefined);
  assert.equal(manager.activeEntries.size, 0);
  assert.equal(manager.combatEntries.size, 0);
  assert.equal(manager.targetEntities.length, 0);
});

test('somente perseguição cria controlador e coleção de alvos estável', () => {
  const manager = Object.create(MonsterManager.prototype);
  manager.navigation = { isAreaWalkable: () => true };
  manager.activeEntries = new Set();
  manager.combatEntries = new Set();
  manager.targetEntities = [];
  manager.updateTargetMembership = MonsterManager.prototype.updateTargetMembership;
  const entry = {
    entity: {
      id: 'pursuer', x: 100, y: 100, moving: false,
      definition: { speed: 20, collision: { radius: 8 }, behavior: { moveChance: 0 } },
      setMoving(value) { this.moving = value; }
    },
    zone: { x: 100, y: 100, radius: 100 },
    mode: 'dormant',
    behavior: null,
    renderer: { setShadowEnabled() {}, play() {} }
  };
  manager.setEntryMode(entry, 'pursuit', 0);
  assert.ok(entry.behavior);
  assert.equal(manager.activeEntries.has(entry), true);
  assert.equal(manager.targetEntities[0], entry.entity);
  manager.setEntryMode(entry, 'combat', 10);
  assert.equal(entry.behavior, null);
  assert.equal(manager.combatEntries.has(entry), true);
});
