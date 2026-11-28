import test from 'node:test';
import assert from 'node:assert/strict';
import GameSystemsBootstrap from '../src/core/lifecycle/GameSystemsBootstrap.js';

function displayObject() {
  return {
    visible: true,
    setStrokeStyle() { return this; },
    setDepth() { return this; },
    setVisible(value) { this.visible = value; return this; },
    setOrigin() { return this; },
    setScrollFactor() { return this; },
    setPosition(x, y) { this.position = { x, y }; return this; },
    setText(value) { this.text = value; return this; },
    add() { return this; },
    destroy() { this.destroyed = true; }
  };
}

function harness() {
  const inputHandlers = new Map();
  const scaleHandlers = new Map();
  const marker = displayObject();
  const monitorLayer = displayObject();
  const scene = {
    navigation: {
      width: 1000,
      height: 1000,
      findNearestWalkablePoint: (x, y) => ({ x, y }),
      findPath: (_x, _y, x, y) => [{ x, y }],
      isAreaWalkable: () => true
    },
    add: {
      circle: () => marker,
      layer: () => monitorLayer,
      rectangle: () => displayObject(),
      text: () => displayObject()
    },
    scale: {
      width: 960,
      height: 540,
      on: (event, callback, context) => scaleHandlers.set(event, { callback, context }),
      off: event => scaleHandlers.delete(event)
    },
    input: {
      addPointer() {},
      on: (event, callback, context) => inputHandlers.set(event, { callback, context }),
      off: event => inputHandlers.delete(event)
    }
  };
  const player = {
    x: 100, y: 100, speed: 200, alive: true, moving: false, level: 1, experience: 0, statPoints: 0,
    stats: { attack: 5, attackSpeed: 1, penetration: 0 },
    setMoving(value) { this.moving = Boolean(value); },
    setFacing(x, y) { this.facing = { x, y }; },
    setPosition(x, y) { this.x = x; this.y = y; },
    markCombat(now) { this.lastCombatAt = now; },
    restoreHealth() {},
    restoreEnergy() {}
  };
  const target = { id: 'slime-1', x: 110, y: 100, alive: true };
  const attacks = [];
  const actions = [];
  const monsterManager = {
    getAliveEntities: () => [target],
    getCombatEntries: () => [],
    damage: (...args) => attacks.push(args)
  };
  const characterRenderer = { playAction: (...args) => actions.push(args) };
  const camera = { getWorldPoint: (x, y) => ({ x: x + 200, y: y + 300 }) };
  const cameraCalls = [];
  const cameraController = {
    createHudCamera: layer => cameraCalls.push(['hud', layer]),
    getMinimumZoom: () => 0.2,
    getMaximumZoom: () => 0.6,
    clampToWorld: () => cameraCalls.push(['clamp']),
    handleManualPan: () => cameraCalls.push(['pan']),
    followPlayer: options => cameraCalls.push(['follow', options])
  };
  return { scene, player, target, monsterManager, characterRenderer, camera, cameraController, inputHandlers, scaleHandlers, marker, monitorLayer, attacks, actions, cameraCalls };
}

test('bootstrap conecta combate, progressão e tap-to-move e libera listeners ao encerrar', () => {
  const f = harness();
  const levelUps = [];
  const bootstrap = new GameSystemsBootstrap(f.scene);
  const systems = bootstrap.initialize({
    player: f.player,
    characterRenderer: f.characterRenderer,
    camera: f.camera,
    cameraController: f.cameraController,
    monsterManager: f.monsterManager,
    showLevelUpNotice: level => levelUps.push(level)
  });

  assert.equal(bootstrap.initialized, true);
  assert.equal(systems.movement, f.scene.movement);
  assert.equal(f.inputHandlers.size, 4);
  assert.equal(f.cameraCalls[0][0], 'hud');

  f.scene.combat.update(0);
  assert.equal(f.actions[0][0], 'combat');
  assert.equal(f.attacks[0][0], f.target.id);

  const progression = f.scene.progression.award(f.player, 100);
  assert.equal(progression.levelsGained, 1);
  assert.deepEqual(levelUps, [2]);
  assert.equal(f.player.statPoints, 3);

  const down = f.inputHandlers.get('pointerdown');
  const up = f.inputHandlers.get('pointerup');
  down.callback.call(down.context, { id: 1, x: 40, y: 60 });
  up.callback.call(up.context, { id: 1, x: 40, y: 60 });
  assert.deepEqual(f.scene.movement.destination, { x: 240, y: 360 });
  assert.equal(f.marker.visible, true);
  assert.ok(f.cameraCalls.some(call => call[0] === 'follow' && call[1]?.smoothReturn === true));

  bootstrap.destroy();
  assert.equal(f.inputHandlers.size, 0);
  assert.equal(f.scaleHandlers.size, 0);
  assert.equal(f.marker.destroyed, true);
  assert.equal(f.monitorLayer.destroyed, true);
  assert.equal(f.scene.movement, null);
  assert.equal(f.scene.progression, null);
  assert.equal(bootstrap.scene, null);
});
