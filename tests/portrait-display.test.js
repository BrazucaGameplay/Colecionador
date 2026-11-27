import test from 'node:test';
import assert from 'node:assert/strict';
import { setPortraitTexture } from '../src/ui/HUD/PortraitDisplay.js';

function mockImage(width, height) {
  const calls = [];
  return {
    frame: { width, height },
    scaleX: 1,
    scaleY: 1,
    calls,
    setTexture(key) { calls.push(['texture', key]); return this; },
    setScale(value) { this.scaleX = value; this.scaleY = value; calls.push(['scale', value]); return this; }
  };
}

test('mantém a proporção de retrato vertical sem distorcer a imagem', () => {
  const image = mockImage(384, 768);
  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_2', 155, 255), true);
  assert.equal(image.scaleX, image.scaleY);
  assert.equal(384 * image.scaleX, 127.5);
  assert.equal(768 * image.scaleY, 255);
});

test('mantém proporção quadrada e limita ambas as dimensões', () => {
  const image = mockImage(384, 384);
  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_1', 48, 72), true);
  assert.equal(384 * image.scaleX, 48);
  assert.equal(384 * image.scaleY, 48);
});

test('não tenta alterar imagem quando chave ou limites estão ausentes', () => {
  const image = mockImage(384, 384);
  assert.equal(setPortraitTexture(image, '', 48, 72), false);
  assert.equal(setPortraitTexture(image, 'portrait', 0, 72), false);
  assert.equal(image.calls.length, 0);
});
