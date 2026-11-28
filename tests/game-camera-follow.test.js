import test from 'node:test';
import assert from 'node:assert/strict';
import CameraController from '../src/systems/camera/CameraController.js';

function makeCamera() {
  return {
    width: 400, height: 300, zoom: 0.4, scrollX: 0, scrollY: 0,
    setBounds(x, y, width, height) { this.bounds = { x, y, width, height }; return this; },
    setZoom(value) { this.zoom = value; return this; },
    startFollow(target, roundPixels, lerpX, lerpY) { this.follow = { target, roundPixels, lerpX, lerpY }; },
    stopFollow() { this.follow = null; },
    setViewport(_x, _y, width, height) { this.width = width; this.height = height; }
  };
}

test('retorno após arraste interpola até o sprite sem salto de câmera', () => {
  const camera = makeCamera();
  const scene = { cameras: { main: camera }, oceanBounds: { x: -1000, y: -1000, width: 4000, height: 4000 } };
  const target = { x: 100, y: 120 };
  const controller = new CameraController(scene);
  controller.initialize(target);
  assert.equal(camera.follow.target, target);

  controller.handleManualPan();
  camera.scrollX = 80;
  camera.scrollY = 60;
  target.x = 700;
  target.y = 650;
  controller.followPlayer({ smoothReturn: true });

  assert.equal(camera.follow, null);
  assert.equal(controller.manualFollow, true);
  controller.update(16.67);
  assert.ok(camera.scrollX > 80 && camera.scrollX < 500);
  assert.ok(camera.scrollY > 60 && camera.scrollY < 450);

  for (let i = 0; i < 240; i++) controller.update(16.67);
  assert.ok(Math.abs(camera.scrollX - 500) < 1);
  assert.ok(Math.abs(camera.scrollY - 500) < 1);
  controller.destroy();
});
