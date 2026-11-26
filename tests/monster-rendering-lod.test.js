import test from 'node:test';
import assert from 'node:assert/strict';
import MonsterRenderer from '../src/rendering/monsters/MonsterRenderer.js';

function createRendererHarness() {
  const created = { images: 0, ellipses: 0, destroyed: 0 };
  const makeObject = () => ({
    frame: { realWidth: 32, realHeight: 32, width: 32, height: 32 },
    texture: { key: 'idle' }, visible: true,
    setOrigin() { return this; }, setScale() { return this; },
    setVisible(value) { this.visible = value; return this; },
    setTexture(key) { this.texture.key = key; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    destroy() { created.destroyed++; }
  });
  const scene = {
    textures: { exists: () => true },
    add: {
      image() { created.images++; return makeObject(); },
      ellipse() { created.ellipses++; return makeObject(); }
    }
  };
  const monster = { x: 100, y: 200 };
  const definition = { visual: {
    enabled: true, scale: 1, originX: 0.5, originY: 0.92,
    animations: { idle: { key: 'idle' }, walking: { key: 'walk' }, attack: { key: 'attack' }, death: { key: 'death' } }
  }};
  return { renderer: new MonsterRenderer(scene, monster, definition, { apply() {} }), created };
}

test('monstro dormente usa somente a imagem estática, sem sombra extra', () => {
  const { renderer, created } = createRendererHarness();
  assert.equal(created.images, 1);
  assert.equal(created.ellipses, 0);
  assert.equal(renderer.shadow, null);
  renderer.setInView(true);
  assert.equal(created.ellipses, 0);
  renderer.destroy();
});

test('sombra só é criada na faixa próxima e removida ao adormecer', () => {
  const { renderer, created } = createRendererHarness();
  renderer.setShadowEnabled(true);
  assert.equal(created.ellipses, 1);
  assert.ok(renderer.shadow);
  renderer.setShadowEnabled(true);
  assert.equal(created.ellipses, 1);
  renderer.setShadowEnabled(false);
  assert.equal(renderer.shadow, null);
  assert.equal(created.destroyed, 1);
  renderer.destroy();
});

test('culling repetido não reaplica visibilidade sem mudança de estado', () => {
  const { renderer } = createRendererHarness();
  let calls = 0;
  const original = renderer.sprite.setVisible;
  renderer.sprite.setVisible = function(value) { calls++; return original.call(this, value); };
  renderer.setInView(false);
  const afterChange = calls;
  renderer.setInView(false);
  assert.equal(calls, afterChange);
  renderer.setInView(true);
  assert.equal(calls, afterChange + 1);
  renderer.destroy();
});
