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
  assert.equal(JSON.parse(storage.getItem('colecionador-save-v1')).score, 12);
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
  assert.equal(JSON.parse(storage.getItem('colecionador-save-v1')).score, 0);
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
