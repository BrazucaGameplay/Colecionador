import test from 'node:test';
import assert from 'node:assert/strict';
import MonsterRenderer from '../src/rendering/monsters/MonsterRenderer.js';
import { MONSTER_DEFINITIONS } from '../src/data/monsters/index.js';

function createSprite() {
  return {
    texture: { key: 'monster-slime-idle' },
    frame: { realWidth: 100, realHeight: 80, width: 100, height: 80 },
    visible: true,
    setTexture(key) { this.texture = { key }; return this; },
    setOrigin() { return this; },
    setScale() { return this; },
    setPosition() { return this; },
    setVisible(value) { this.visible = value; return this; },
    destroy() {}
  };
}

test('slime exibe a imagem estática de morte e respeita a visibilidade da câmera', () => {
  const sprite = createSprite();
  const scene = {
    textures: { exists: () => true },
    add: { image: () => sprite }
  };
  const monster = { x: 120, y: 240 };
  const renderer = new MonsterRenderer(scene, monster, MONSTER_DEFINITIONS.slime);

  assert.equal(renderer.play('death', 1000), true);
  assert.equal(sprite.texture.key, 'monster-slime-death');
  assert.equal(renderer.currentState, 'death');
  assert.equal(sprite.visible, true);
  assert.equal(renderer.actionUntil, Number.POSITIVE_INFINITY);

  renderer.setInView(false);
  assert.equal(sprite.visible, false);
  renderer.setInView(true);
  assert.equal(sprite.visible, true);

  renderer.destroy();
});
