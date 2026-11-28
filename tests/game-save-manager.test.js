import test from 'node:test';
import assert from 'node:assert/strict';
import Player from '../src/entities/Player.js';
import SaveManager from '../src/systems/persistence/SaveManager.js';
import { SAVE_KEY } from '../src/core/config/index.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    values
  };
}

test('progresso real do Player e skin selecionada sobrevivem ao ciclo save/load', () => {
  const storage = memoryStorage();
  const player = new Player({ x: 120, y: 240, saveData: { level: 4, experience: 35, statPoints: 2 } });
  assert.equal(player.allocateStat('attack'), true);
  const manager = new SaveManager({ key: SAVE_KEY, storage, now: () => 123456, logger: { warn() {} } });

  assert.equal(manager.save({
    score: 18,
    player: player.toSaveData(),
    selectedSkin: 'skin_2'
  }), true);

  const loaded = new SaveManager({ key: SAVE_KEY, storage, now: () => 123457, logger: { warn() {} } }).load();
  const restoredPlayer = new Player({ saveData: loaded.player });
  assert.equal(loaded.score, 18);
  assert.equal(loaded.selectedSkin, 'skin_2');
  assert.equal(loaded.at, 123456);
  assert.equal(restoredPlayer.level, 4);
  assert.equal(restoredPlayer.experience, 35);
  assert.equal(restoredPlayer.stats.attack, player.stats.attack);
  assert.equal(restoredPlayer.statPoints, 1);
});

test('falha de persistência não altera o estado lógico do jogador', () => {
  const player = new Player({ saveData: { level: 2, statPoints: 1 } });
  const storage = { getItem() { return null; }, setItem() { throw new Error('quota'); } };
  const manager = new SaveManager({ key: SAVE_KEY, storage, logger: { warn() {} } });

  assert.equal(player.allocateStat('defense'), true);
  assert.equal(manager.save({ player: player.toSaveData() }), false);
  assert.equal(player.stats.defense, 1);
  assert.equal(player.statPoints, 0);
});
