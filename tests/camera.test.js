import test from 'node:test';
import assert from 'node:assert/strict';
import CameraController from '../src/world/CameraController.js';
import { cameraRelativeVector } from '../src/systems/CameraRelativeInput.js';
import { CAMERA_CONFIG } from '../src/config/CameraConfig.js';

function createCamera() {
  return {
    rotations: [],
    zooms: [],
    rotateTo(...args) { this.rotations.push(args); },
    setZoom(value) { this.zooms.push(value); }
  };
}

test('CameraController rotates through the four configured orientations', () => {
  const camera = createCamera();
  const controller = new CameraController(camera);

  assert.equal(controller.rotateQuarterTurn(1, 300), true);
  assert.equal(controller.orientation, 90);
  assert.equal(camera.rotations[0][0], Math.PI / 2);
  assert.equal(controller.rotateQuarterTurn(-1), true);
  assert.equal(controller.orientation, 0);
});

test('CameraController rejects unsupported orientations and invalid durations', () => {
  const camera = createCamera();
  const controller = new CameraController(camera);

  assert.equal(controller.setOrientation(45), false);
  assert.throws(() => controller.setOrientation(90, -1), TypeError);
  assert.equal(camera.rotations.length, 0);
});

test('CameraController does not guess zoom limits that remain undefined', () => {
  const camera = createCamera();
  const controller = new CameraController(camera, CAMERA_CONFIG);

  assert.equal(controller.setZoom(1.5), false);
  assert.deepEqual(camera.zooms, []);
});

test('camera-relative input maps screen direction to world direction', () => {
  const up = cameraRelativeVector({ x: 1, y: 0 }, 90);
  assert.ok(Math.abs(up.x) < 1e-10);
  assert.equal(Math.round(up.y), -1);

  const left = cameraRelativeVector({ x: 1, y: 0 }, 180);
  assert.equal(Math.round(left.x), -1);
  assert.ok(Math.abs(left.y) < 1e-10);
});

test('camera-relative input rejects invalid vectors and rotations', () => {
  assert.throws(() => cameraRelativeVector(null, 0), TypeError);
  assert.throws(() => cameraRelativeVector({ x: 1, y: 0 }, NaN), TypeError);
});
