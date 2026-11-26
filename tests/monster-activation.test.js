import test from 'node:test';
import assert from 'node:assert/strict';
import MonsterManager from '../src/systems/monsters/MonsterManager.js';

function makeEntry(id, x, y) {
  return {
    entity: { id, x, y, dead: false },
    mode: 'dormant',
    renderer: {
      frameBox: { width: 20, height: 20 },
      inView: null,
      setInView(visible) { this.inView = visible; }
    }
  };
}

test('câmera faz culling de monstros dormentes sem ativá-los', () => {
  const nearPlayer = makeEntry('near-player', 600, 0);
  const farFromPlayer = makeEntry('far-from-player', 4000, 0);
  const manager = Object.create(MonsterManager.prototype);

  manager.playerBody = { player: { x: 0, y: 0 } };
  manager.entries = new Map([
    [nearPlayer.entity.id, nearPlayer],
    [farFromPlayer.entity.id, farFromPlayer]
  ]);
  manager.activeEntries = new Set();
  manager.activationCheckIntervalMs = 250;
  manager.nextActivationCheckAt = 0;
  manager.visibilityCheckIntervalMs = 150;
  manager.nextVisibilityCheckAt = 0;
  manager.visibilityPaddingFactor = 0;
  manager.scene = {
    cameras: {
      main: {
        worldView: { x: 3990, y: -20, width: 100, height: 100 }
      }
    }
  };

  const activationChanges = [];
  manager.setEntryMode = (entry, mode) => {
    entry.mode = mode;
    activationChanges.push({ id: entry.entity.id, mode });
  };

  // A distância do jogador ativa o monstro próximo, mesmo fora da câmera.
  manager.updateActivation(0);
  // A câmera encontra o monstro distante, mas só altera sua visibilidade.
  manager.updateVisibility(0);

  assert.equal(nearPlayer.mode, 'pursuit');
  assert.equal(nearPlayer.renderer.inView, false);
  assert.equal(farFromPlayer.mode, 'dormant');
  assert.equal(farFromPlayer.renderer.inView, true);
  assert.deepEqual(activationChanges, [{ id: 'near-player', mode: 'pursuit' }]);
  assert.equal(manager.activeEntries.size, 0);
});

test('mover ou ampliar a câmera não altera a ativação baseada na distância', () => {
  const dormant = makeEntry('dormant', 4000, 0);
  const manager = Object.create(MonsterManager.prototype);
  manager.playerBody = { player: { x: 0, y: 0 } };
  manager.entries = new Map([[dormant.entity.id, dormant]]);
  manager.activationCheckIntervalMs = 250;
  manager.nextActivationCheckAt = 0;
  manager.scene = {
    cameras: {
      main: { worldView: { x: 3900, y: -100, width: 500, height: 300 }, zoom: 2 }
    }
  };
  manager.setEntryMode = (entry, mode) => { entry.mode = mode; };

  manager.updateActivation(0);
  assert.equal(dormant.mode, 'dormant');

  manager.scene.cameras.main.worldView = { x: 0, y: 0, width: 8000, height: 8000 };
  manager.scene.cameras.main.zoom = 0.2;
  manager.updateActivation(250);
  assert.equal(dormant.mode, 'dormant');
});
