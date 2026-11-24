import test from 'node:test';
import assert from 'node:assert/strict';
import CameraController from '../src/world/CameraController.js';
import { cameraRelativeVector } from '../src/systems/CameraRelativeInput.js';
import { CAMERA_CONFIG } from '../src/config/CameraConfig.js';

function createCamera() {
  return {
    rotations: [],
    zooms: [],
    rotation: 0,
    rotateTo(...args) { this.rotations.push(args); this.rotation = args[0]; },
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

test('camera-relative input rotates screen vector into world coordinates', () => {
  const down = cameraRelativeVector({ x: 1, y: 0 }, 90);
  assert.equal(Math.round(down.x), 0);
  assert.equal(Math.round(down.y), 1);

  const left = cameraRelativeVector({ x: 1, y: 0 }, 180);
  assert.equal(Math.round(left.x), -1);
  assert.equal(Math.round(left.y), 0);

  const up = cameraRelativeVector({ x: 1, y: 0 }, 270);
  assert.equal(Math.round(up.x), 0);
  assert.equal(Math.round(up.y), -1);
});

test('camera-relative input rejects invalid vectors and rotations', () => {
  assert.throws(() => cameraRelativeVector(null, 0), TypeError);
  assert.throws(() => cameraRelativeVector({ x: 1, y: 0 }, NaN), TypeError);
});

test('camera-relative orientation follows the live camera angle during animation', () => {
  const camera = createCamera();
  const controller = new CameraController(camera);

  controller.setOrientation(90, 500);
  camera.rotation = Math.PI / 4;
  assert.equal(Math.round(controller.orientation), 45);
  assert.equal(controller.targetOrientation, 90);
});
