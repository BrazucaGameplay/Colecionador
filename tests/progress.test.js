import test from 'node:test';
import assert from 'node:assert/strict';
import ProgressManager from '../src/systems/ProgressManager.js';
import EventBus from '../src/core/EventBus.js';

function createSaveManager(initial = { score: 0 }) {
  let data = structuredClone(initial);
  return {
    load() { return structuredClone(data); },
    save(snapshot) { data = structuredClone(snapshot); return true; },
    getStored() { return structuredClone(data); }
  };
}

test('ProgressManager registers sections and emits isolated change events', () => {
  const eventBus = new EventBus();
  const saveManager = createSaveManager();
  const progress = new ProgressManager({ eventBus, saveManager });
  progress.registerSection('inventory', { items: [] });

  let event = null;
  eventBus.on('progress:changed', payload => { event = payload; });
  const inventory = { items: [{ id: 'rose', quantity: 2 }] };

  assert.equal(progress.setSection('inventory', inventory), true);
  inventory.items[0].quantity = 99;

  assert.deepEqual(progress.getSection('inventory'), {
    items: [{ id: 'rose', quantity: 2 }]
  });
  assert.deepEqual(event, {
    section: 'inventory',
    data: { items: [{ id: 'rose', quantity: 2 }] }
  });
});

test('ProgressManager loads, snapshots and saves multiple registered sections', () => {
  const eventBus = new EventBus();
  const saveManager = createSaveManager({
    score: 8,
    player: { level: 3 },
    inventory: { items: ['rose'] },
    unregistered: { ignoredByThisManager: true }
  });
  const progress = new ProgressManager({ eventBus, saveManager });
  progress.registerSection('player', { level: 1 });
  progress.registerSection('inventory', { items: [] });

  const loaded = progress.load();
  assert.equal(loaded.score, 8);
  assert.deepEqual(loaded.player, { level: 3 });
  assert.deepEqual(loaded.inventory, { items: ['rose'] });
  assert.deepEqual(loaded.unregistered, { ignoredByThisManager: true });

  progress.setScore(9);
  assert.equal(progress.save(), true);
  assert.equal(saveManager.getStored().score, 9);
  assert.deepEqual(saveManager.getStored().inventory, { items: ['rose'] });
  assert.deepEqual(saveManager.getStored().unregistered, { ignoredByThisManager: true });
});

test('ProgressManager falls back to defaults when a section fails validation', () => {
  const eventBus = new EventBus();
  const saveManager = createSaveManager({ score: 0, player: { level: -1 } });
  const progress = new ProgressManager({ eventBus, saveManager });
  progress.registerSection('player', { level: 1 }, data => data.level >= 1);

  assert.deepEqual(progress.load().player, { level: 1 });
  assert.equal(progress.setSection('player', { level: 0 }), false);
});

test('ProgressManager rejects reserved names, duplicate sections and cyclic values', () => {
  const progress = new ProgressManager({
    eventBus: new EventBus(),
    saveManager: createSaveManager()
  });
  assert.throws(() => progress.registerSection('score', 0), TypeError);
  progress.registerSection('inventory', { items: [] });
  assert.throws(() => progress.registerSection('inventory', { items: [] }), Error);

  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(progress.setSection('inventory', cyclic), false);
  assert.equal(progress.setScore(-1), false);
});

test('ProgressManager can register a section after loading and restore preserved data', () => {
  const progress = new ProgressManager({
    eventBus: new EventBus(),
    saveManager: createSaveManager({ score: 0, waifus: { owned: ['slime'] } })
  });

  progress.load();
  progress.registerSection('waifus', { owned: [] });
  assert.deepEqual(progress.getSection('waifus'), { owned: ['slime'] });
});

test('ProgressManager preserves explicit null values in unregistered sections', () => {
  const saveManager = createSaveManager({ score: 0, optionalFeature: null });
  const progress = new ProgressManager({ eventBus: new EventBus(), saveManager });

  assert.equal(progress.load().optionalFeature, null);
  assert.equal(progress.save(), true);
  assert.equal(saveManager.getStored().optionalFeature, null);
});
