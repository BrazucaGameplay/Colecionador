import test from 'node:test';
import assert from 'node:assert/strict';
import { setPortraitTexture } from '../src/ui/HUD/PortraitDisplay.js';

test('trocar retrato reaplica tamanho fixo após mudar textura de resolução', () => {
  const calls = [];
  const image = {
    setTexture(key) { calls.push(['texture', key]); return this; },
    setDisplaySize(width, height) { calls.push(['size', width, height]); return this; }
  };

  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_2', 48, 72), true);
  assert.deepEqual(calls, [
    ['texture', 'skin-portrait-skin_2'],
    ['size', 48, 72]
  ]);
});

test('não tenta alterar imagem quando chave de textura está ausente', () => {
  let called = false;
  const image = { setTexture() { called = true; }, setDisplaySize() { called = true; } };
  assert.equal(setPortraitTexture(image, '', 48, 72), false);
  assert.equal(called, false);
});
