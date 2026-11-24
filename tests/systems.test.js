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
