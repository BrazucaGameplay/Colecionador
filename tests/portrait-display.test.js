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
    texture: { setFilter(value) { calls.push(['filter', value]); } },
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

test('preserva a fonte 2288x1249 e usa filtro linear para ilustração detalhada', () => {
  const image = mockImage(2288, 1249);
  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_2', 420, 300), true);
  assert.equal(image.scaleX, image.scaleY);
  assert.equal(2288 * image.scaleX, 420);
  assert.ok(Math.abs(1249 * image.scaleY - 229.2745) < 0.01);
  assert.deepEqual(image.calls.find(call => call[0] === 'filter'), ['filter', 0]);
  assert.deepEqual(image.calls[0], ['texture', 'skin-portrait-skin_2']);
});

test('perfil reserva uma área horizontal ampla sem invadir o quadro', async () => {
  const { PROFILE_PORTRAIT_FIT } = await import('../src/ui/HUD/PortraitDisplay.js');
  assert.equal(PROFILE_PORTRAIT_FIT.width, 0.88);
  assert.equal(PROFILE_PORTRAIT_FIT.height, 0.58);
  assert.ok(PROFILE_PORTRAIT_FIT.width < 0.86);
});

test('não reaplica textura, filtro ou escala quando o retrato não mudou', () => {
  const calls = [];
  const texture = { key: 'skin-portrait-skin_2', setFilter(value) { calls.push(['filter', value]); } };
  const image = {
    texture,
    frame: { width: 2288, height: 1249 },
    scaleX: 420 / 2288,
    scaleY: 420 / 2288,
    setTexture(key) { calls.push(['texture', key]); this.texture = texture; return this; },
    setScale(value) { calls.push(['scale', value]); this.scaleX = value; this.scaleY = value; return this; }
  };

  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_2', 420, 300), true);
  assert.equal(setPortraitTexture(image, 'skin-portrait-skin_2', 420, 300), true);
  assert.deepEqual(calls, []);
});

test('aplica textura e filtro apenas uma vez quando a skin realmente muda', () => {
  const calls = [];
  const image = {
    texture: { key: 'skin-01', setFilter(value) { calls.push(['filter', value]); } },
    frame: { width: 2288, height: 1249 },
    scaleX: 0, scaleY: 0,
    setTexture(key) { calls.push(['texture', key]); this.texture = { key, setFilter(value) { calls.push(['filter', value]); } }; return this; },
    setScale(value) { calls.push(['scale', value]); this.scaleX = value; this.scaleY = value; return this; }
  };

  setPortraitTexture(image, 'skin-02', 420, 300);
  setPortraitTexture(image, 'skin-02', 420, 300);
  assert.equal(calls.filter(call => call[0] === 'texture').length, 1);
  assert.equal(calls.filter(call => call[0] === 'filter').length, 1);
  assert.equal(calls.filter(call => call[0] === 'scale').length, 1);
});
