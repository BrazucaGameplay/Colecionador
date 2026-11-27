import test from 'node:test';
import assert from 'node:assert/strict';
import SkinManager from '../src/rendering/characters/SkinManager.js';
import {
  CHARACTER_SKINS,
  DEFAULT_CHARACTER_SKIN,
  REQUIRED_SKIN_ANIMATIONS
} from '../src/rendering/characters/CharacterSkinCatalog.js';

test('catálogo define a skin original como padrão e pronta', () => {
  const manager = new SkinManager();
  assert.equal(manager.getSelectedSkin(), DEFAULT_CHARACTER_SKIN);
  assert.equal(manager.getSelectedDefinition().status, 'ready');
});

test('skin 2 permanece catalogada, mas não selecionável antes dos atlas', () => {
  const manager = new SkinManager({ selectedSkin: 'skin_2' });
  assert.equal(manager.getSelectedSkin(), DEFAULT_CHARACTER_SKIN);
  assert.equal(manager.isSelectable('skin_2'), false);
  assert.equal(manager.getCatalog().find((skin) => skin.id === 'skin_2').status, 'preparation');
  assert.deepEqual(Object.keys(CHARACTER_SKINS.skin_2.references).sort(), ['combat', 'dying', 'idle', 'running']);
});

test('o contrato reserva todas as animações exigidas para cada skin', () => {
  assert.deepEqual(REQUIRED_SKIN_ANIMATIONS, [
    'idle', 'walking', 'running', 'dying', 'flirtyStrut', 'combat', 'combatSlash', 'jump'
  ]);
  for (const skin of Object.values(CHARACTER_SKINS)) {
    for (const animationId of REQUIRED_SKIN_ANIMATIONS) {
      assert.ok(skin.animations[animationId], skin.id + ':' + animationId);
    }
  }
});

test('seleção rejeita skins sem pacote pronto e mantém a seleção atual', () => {
  const manager = new SkinManager();
  const result = manager.selectSkin('skin_2');
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'skin-not-ready');
  assert.equal(manager.getSelectedSkin(), DEFAULT_CHARACTER_SKIN);
});

test('skin pronta pode ser selecionada e notifica o proprietário', () => {
  const changes = [];
  const manager = new SkinManager({ onChange: (change) => changes.push(change) });
  // A skin original é a única habilitada neste estágio.
  const result = manager.selectSkin('skin_01');
  assert.equal(result.reason, 'already-selected');
  assert.equal(changes.length, 0);
});
