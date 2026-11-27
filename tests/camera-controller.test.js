import test from 'node:test';
import assert from 'node:assert/strict';
import CameraController from '../src/systems/camera/CameraController.js';

function createCamera() {
  return {
    width: 400, height: 300, zoom: 1, scrollX: 0, scrollY: 0,
    bounds: null, follow: null, ignored: [], roundPixels: false,
    setBounds(x, y, width, height) { this.bounds = { x, y, width, height }; return this; },
    setZoom(value) { this.zoom = value; return this; },
    startFollow(target, roundPixels, lerpX, lerpY) { this.follow = { target, roundPixels, lerpX, lerpY }; },
    stopFollow() { this.follow = null; },
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
  assert.equal(f.mainCamera.roundPixels, false);
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
  assert.equal(f.hudCamera.roundPixels, true);
  assert.equal(f.mainCamera.follow.lerpX, 0.06);
  assert.equal(f.mainCamera.follow.lerpY, 0.06);
  controller.handleManualPan();
  f.mainCamera.scrollX = 100;
  f.mainCamera.scrollY = 50;
  sprite.x = 600;
  sprite.y = 500;
  controller.followPlayer({ smoothReturn: true });
  assert.equal(f.mainCamera.follow, null, 'o retorno suave não deve ativar startFollow');
  assert.equal(controller.manualFollow, true);
  controller.update(16.67);
  assert.ok(f.mainCamera.scrollX > 100 && f.mainCamera.scrollX < 400,
    'a câmera deve avançar parcialmente, sem saltar para o jogador');
  assert.ok(f.mainCamera.scrollY > 50 && f.mainCamera.scrollY < 350,
    'o eixo vertical também deve interpolar gradualmente');
  for (let i = 0; i < 180; i++) controller.update(16.67);
  assert.ok(Math.abs(f.mainCamera.scrollX - 400) < 1);
  assert.ok(Math.abs(f.mainCamera.scrollY - 350) < 1);
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
