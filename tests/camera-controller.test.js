import test from 'node:test';
import assert from 'node:assert/strict';
import CameraController from '../src/systems/camera/CameraController.js';

function createCamera() {
  return {
    width: 400, height: 300, zoom: 1, scrollX: 0, scrollY: 0,
    bounds: null, follow: null, ignored: [],
    setBounds(x, y, width, height) { this.bounds = { x, y, width, height }; return this; },
    setZoom(value) { this.zoom = value; return this; },
    startFollow(target, roundPixels, lerpX, lerpY) { this.follow = { target, roundPixels, lerpX, lerpY }; },
    ignore(items) { this.ignored.push(items); },
    setViewport(x, y, width, height) { this.viewport = { x, y, width, height }; },
    setScroll() { return this; }
  };
}

function createScene() {
  const mainCamera = createCamera();
  const hudCamera = createCamera();
  const listeners = new Map();
  const removed = [];
  const scene = {
    cameras: { main: mainCamera, add: () => hudCamera, remove: camera => removed.push(camera) },
    scale: {
      width: 400, height: 300,
      on: (event, callback, context) => listeners.set(event, { callback, context }),
      off: event => listeners.delete(event)
    },
    children: { list: ['world', 'hud', 'monitor'] },
    oceanBounds: { x: -1000, y: -1000, width: 3000, height: 3000 },
    worldBootstrap: { updateOceanBounds(width, height) {
      scene.oceanBounds = { x: -width, y: -height, width: width * 3, height: height * 3 };
    } }
  };
  return { scene, mainCamera, hudCamera, listeners, removed };
}

test('inicializa zoom padrão 0.4x, limites 0.2x–0.6x e follow no sprite visual', () => {
  const f = createScene();
  const controller = new CameraController(f.scene);
  const sprite = { id: 'rendered-player' };
  assert.equal(controller.initialize(sprite), f.mainCamera);
  assert.equal(f.mainCamera.zoom, 0.4);
  assert.deepEqual(f.mainCamera.bounds, f.scene.oceanBounds);
  assert.deepEqual(f.mainCamera.follow, { target: sprite, roundPixels: false, lerpX: 0.06, lerpY: 0.06 });
  assert.equal(controller.getMinimumZoom(), 0.2);
  assert.equal(controller.getMaximumZoom(), 0.6);
  controller.destroy();
});

test('limita scroll dentro dos limites do oceano e centraliza quando viewport excede o mundo', () => {
  const f = createScene();
  const controller = new CameraController(f.scene);
  controller.camera = f.mainCamera;
  f.mainCamera.zoom = 1;
  f.mainCamera.scrollX = -2000;
  f.mainCamera.scrollY = 9000;
  controller.clampToWorld();
  assert.equal(f.mainCamera.scrollX, -1000);
  assert.equal(f.mainCamera.scrollY, 1700);
  f.mainCamera.width = 5000;
  f.mainCamera.height = 5000;
  controller.clampToWorld();
  assert.equal(f.mainCamera.scrollX, -2000);
  assert.equal(f.mainCamera.scrollY, -2000);
  controller.destroy();
});

test('follow só é reiniciado após pan manual e HUD acompanha resize', () => {
  const f = createScene();
  const controller = new CameraController(f.scene);
  const sprite = {};
  controller.initialize(sprite);
  controller.createHudCamera('monitor');
  controller.handleManualPan();
  controller.followPlayer();
  assert.equal(f.mainCamera.follow.target, sprite);
  const resize = f.listeners.get('resize');
  resize.callback.call(resize.context, { width: 800, height: 600 });
  assert.deepEqual(f.mainCamera.viewport, { x: 0, y: 0, width: 800, height: 600 });
  assert.deepEqual(f.hudCamera.viewport, { x: 0, y: 0, width: 800, height: 600 });
  assert.equal(f.mainCamera.zoom, 0.4);
  assert.equal(f.mainCamera.bounds.width, 2400);
  controller.destroy();
  assert.equal(f.listeners.has('resize'), false);
  assert.deepEqual(f.removed, [f.hudCamera]);
});
