import test from 'node:test';
import assert from 'node:assert/strict';
import SaveManager from '../src/core/SaveManager.js';
import CombatSystem from '../src/systems/CombatSystem.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

test('SaveManager loads the existing score save format', () => {
  const storage = createStorage({
    'colecionador-save-v1': JSON.stringify({ score: 7, at: 1234 })
  });
  const saveManager = new SaveManager({ storage });

  assert.deepEqual(saveManager.load(), { score: 7, at: 1234 });
  const migrated = JSON.parse(storage.getItem('colecionador-save-v1'));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.data, { score: 7 });
  assert.equal(migrated.savedAt, 1234);
});

test('SaveManager returns safe defaults for invalid JSON', () => {
  const storage = createStorage({ 'colecionador-save-v1': '{invalid' });
  const saveManager = new SaveManager({ storage });

  assert.deepEqual(saveManager.load(), { score: 0, at: null });
});

test('SaveManager persists score using the existing storage key', () => {
  const storage = createStorage();
  const saveManager = new SaveManager({ storage });

  assert.equal(saveManager.save({ score: 12 }), true);
  const saved = JSON.parse(storage.getItem('colecionador-save-v1'));
  assert.equal(saved.version, 2);
  assert.equal(saved.data.score, 12);
});

test('CombatSystem applies damage only after its cooldown', () => {
  const combat = new CombatSystem({ cooldownMs: 500 });
  const monster = {
    dead: false,
    hp: 2,
    takeHit() {
      this.hp -= 1;
      this.dead = this.hp <= 0;
    }
  };

  assert.deepEqual(combat.hitMonster(monster, 1000), { hit: true, defeated: false });
  assert.deepEqual(combat.hitMonster(monster, 1200), { hit: false, defeated: false });
  assert.deepEqual(combat.hitMonster(monster, 1500), { hit: true, defeated: true });
});

test('SaveManager handles storage write failures without throwing', () => {
  const storage = {
    getItem() { return null; },
    setItem() { throw new Error('quota exceeded'); }
  };
  const saveManager = new SaveManager({ storage });

  assert.equal(saveManager.save({ score: 3 }), false);
});

test('SaveManager sanitizes invalid score values', () => {
  const storage = createStorage();
  const saveManager = new SaveManager({ storage });

  assert.equal(saveManager.save({ score: -4 }), true);
  assert.equal(JSON.parse(storage.getItem('colecionador-save-v1')).data.score, 0);
});

import InputController from '../src/systems/InputController.js';

function createInputScene() {
  const handlers = {};
  const removed = {};
  const keyboard = {
    createCursorKeys: () => ({
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false }
    }),
    addKeys: () => ({
      A: { isDown: false },
      D: { isDown: false },
      W: { isDown: false },
      S: { isDown: false }
    })
  };
  const circle = {
    setScrollFactor() { return this; },
    setVisible() { return this; },
    setDepth() { return this; },
    setPosition() { return this; },
    destroy() { this.destroyed = true; }
  };

  return {
    handlers,
    removed,
    scene: {
      add: { circle: () => ({ ...circle }) },
      input: {
        keyboard,
        on: (event, callback) => { handlers[event] = callback; },
        off: (event, callback) => { removed[event] = callback; }
      }
    }
  };
}

test('InputController preserves touch joystick movement', () => {
  const { scene, handlers } = createInputScene();
  const controls = new InputController(scene);

  handlers.pointerdown({ id: 1, x: 100, y: 100 });
  handlers.pointermove({ id: 1, x: 130, y: 100 });

  const movement = controls.getMovementVector();
  assert.ok(movement.x > 0);
  assert.equal(movement.y, 0);
});

test('InputController keeps keyboard as an alternative to touch', () => {
  const { scene } = createInputScene();
  const controls = new InputController(scene);

  controls.wasd.D.isDown = true;
  controls.cursors.up.isDown = true;

  assert.deepEqual(controls.getMovementVector(), { x: 1, y: -1 });
});

test('InputController removes touch listeners and destroys joystick on shutdown', () => {
  const { scene, removed } = createInputScene();
  const controls = new InputController(scene);
  const joystickBase = controls.touch.base;
  const joystickKnob = controls.touch.knob;
  controls.destroy();
  controls.destroy();
  assert.equal(Object.keys(removed).length, 4);
  assert.equal(joystickBase.destroyed, true);
  assert.equal(joystickKnob.destroyed, true);
  assert.deepEqual(controls.getMovementVector(), { x: 0, y: 0 });
});

import EventBus from '../src/core/EventBus.js';

test('EventBus emits payloads to registered listeners', () => {
  const bus = new EventBus();
  let received = null;
  bus.on('monster:defeated', payload => { received = payload; });
  assert.equal(bus.emit('monster:defeated', { id: 'slime' }), 1);
  assert.deepEqual(received, { id: 'slime' });
});

test('EventBus unsubscribe prevents future notifications', () => {
  const bus = new EventBus();
  let calls = 0;
  const unsubscribe = bus.on('player:moved', () => { calls += 1; });
  bus.emit('player:moved');
  unsubscribe();
  bus.emit('player:moved');
  assert.equal(calls, 1);
});

test('EventBus once listener is called only once', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.once('save:completed', () => { calls += 1; });
  bus.emit('save:completed');
  bus.emit('save:completed');
  assert.equal(calls, 1);
});

test('SaveManager rejects unsupported future save versions without overwriting them', () => {
  const futureSave = JSON.stringify({ version: 99, savedAt: 123, data: { score: 42 } });
  const storage = createStorage({ 'colecionador-save-v1': futureSave });
  const manager = new SaveManager({ storage });

  assert.deepEqual(manager.load(), { score: 0, at: null });
  assert.equal(storage.getItem('colecionador-save-v1'), futureSave);
});

test('SaveManager supports storage being unavailable', () => {
  const manager = new SaveManager({ storage: null });
  assert.deepEqual(manager.load(), { score: 0, at: null });
  assert.equal(manager.save({ score: 1 }), false);
});

import WorldCore from '../src/world/WorldCore.js';

test('WorldCore enforces bounds and blocked tiles through public APIs', () => {
  const world = new WorldCore({
    width: 5,
    height: 5,
    blockedTiles: [{ x: 2, y: 2 }],
    playerBodyTile: { x: 0, y: 0 }
  });
  assert.equal(world.isWalkable(1, 1), true);
  assert.equal(world.isWalkable(2, 2), false);
  assert.equal(world.isWalkable(-1, 0), false);
  assert.deepEqual(world.getPlayerBodyTile(), { x: 0, y: 0 });
  assert.equal(world.setPlayerBodyTile({ x: 2, y: 2 }), false);
  assert.equal(world.setPlayerBodyTile({ x: 1, y: 1 }), true);
});

test('WorldCore finds a route around obstacles without cutting blocked corners', () => {
  const world = new WorldCore({
    width: 5,
    height: 5,
    blockedTiles: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    playerBodyTile: { x: 0, y: 0 }
  });
  const path = world.findPath({ x: 0, y: 0 }, { x: 4, y: 0 });
  assert.deepEqual(path[0], { x: 0, y: 0 });
  assert.deepEqual(path.at(-1), { x: 4, y: 0 });
  assert.ok(path.every(tile => world.isWalkable(tile.x, tile.y)));
});

test('WorldCore returns no route for invalid or unreachable destinations', () => {
  const world = new WorldCore({
    width: 3,
    height: 3,
    blockedTiles: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }],
    playerBodyTile: { x: 0, y: 0 }
  });
  assert.deepEqual(world.findPath({ x: 0, y: 0 }, { x: 2, y: 2 }), []);
  assert.deepEqual(world.findPath({ x: -1, y: 0 }, { x: 2, y: 2 }), []);
});

import WorldGrid from '../src/world/WorldGrid.js';

test('WorldGrid validates dimensions and collision coordinates', () => {
  assert.throws(() => new WorldGrid({ width: 0, height: 4 }), TypeError);
  assert.throws(() => new WorldGrid({
    width: 3,
    height: 3,
    blocked: [{ x: 3, y: 0 }]
  }), TypeError);
});

test('WorldGrid reports walkability without exposing its collision storage', () => {
  const world = new WorldGrid({
    width: 4,
    height: 3,
    blocked: [{ x: 1, y: 1 }]
  });
  assert.equal(world.isWalkable(0, 0), true);
  assert.equal(world.isWalkable(1, 1), false);
  assert.equal(world.isWalkable(-1, 0), false);
  assert.equal(world.isWalkable(4, 0), false);
  assert.equal('blocked' in world, true);
  assert.equal(world.blocked, undefined);
});

test('WorldGrid finds an eight-direction path without cutting blocked corners', () => {
  const world = new WorldGrid({
    width: 5,
    height: 5,
    blocked: [{ x: 1, y: 0 }, { x: 0, y: 1 }]
  });
  assert.deepEqual(world.findPath({ x: 0, y: 0 }, { x: 1, y: 1 }), []);
  const path = world.findPath({ x: 0, y: 0 }, { x: 4, y: 4 });
  assert.deepEqual(path[0], { x: 0, y: 0 });
  assert.deepEqual(path.at(-1), { x: 4, y: 4 });
  assert.ok(path.length > 5);
});

test('WorldGrid returns empty paths for invalid or unreachable destinations', () => {
  const world = new WorldGrid({
    width: 3,
    height: 3,
    blocked: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]
  });
  assert.deepEqual(world.findPath({ x: 0, y: 1 }, { x: 2, y: 1 }), []);
  assert.deepEqual(world.findPath({ x: -1, y: 0 }, { x: 2, y: 1 }), []);
  assert.deepEqual(world.findPath({ x: 1, y: 1 }, { x: 1, y: 1 }), []);
});
