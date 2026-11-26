import test from 'node:test';
import assert from 'node:assert/strict';
import WorldObjectManager from '../src/world/WorldObjectManager.js';
import { ISLAND_01_LAYOUT } from '../src/world/map-layout/island-01.js';

function createHarness() {
  const created = [];
  const registered = [];
  const depths = [];
  const scene = {
    textures: {
      get: () => ({ getSourceImage: () => ({ width: 256, height: 256 }) })
    },
    add: {
      image: (x, y, key) => {
        const image = {
          x, y, key, active: true, visible: true, scale: 1, depth: 0,
          setOrigin(originX, originY) { this.originX = originX; this.originY = originY; return this; },
          setActive(value) { this.active = value; return this; },
          setScale(value) { this.scale = value; return this; },
          setRotation(value) { this.rotation = value; return this; },
          setDepth(value) { this.depth = value; depths.push(value); return this; },
          destroy() { this.destroyed = true; }
        };
        created.push(image);
        return image;
      }
    }
  };
  const manager = new WorldObjectManager(scene, {
    depthManager: { apply: (image, y) => image.setDepth(y * 100 + 10) },
    collisionManager: { register: definition => registered.push(definition.id) }
  });
  return { manager, created, registered, depths };
}

test('ilha mantém os 85 elementos como imagens estáticas sem processamento por quadro', () => {
  assert.equal(ISLAND_01_LAYOUT.length, 85);
  const { manager, created, registered, depths } = createHarness();
  const objects = manager.create(ISLAND_01_LAYOUT);

  assert.equal(objects.length, 85);
  assert.equal(created.length, 85);
  assert.equal(registered.length, 85);
  assert.equal(depths.length, 85);

  for (const image of objects) {
    assert.equal(image.active, false);
    assert.equal(image.visible, true);
    assert.equal(typeof image.preUpdate, 'undefined');
    assert.equal(image.body, undefined);
    assert.equal(image.input, undefined);
  }

  manager.destroy();
  assert.ok(created.every(image => image.destroyed));
  assert.equal(manager.objects.length, 0);
});

test('WorldObjectManager não permite instanciar o layout duas vezes', () => {
  const { manager } = createHarness();
  manager.create(ISLAND_01_LAYOUT);
  assert.throws(() => manager.create(ISLAND_01_LAYOUT), /já foi instanciado/);
  manager.destroy();
});
