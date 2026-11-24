import { CAMERA_CONFIG } from '../config/CameraConfig.js';

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

export default class CameraController {
  constructor(camera, config = CAMERA_CONFIG) {
    if (!camera || typeof camera.rotateTo !== 'function') {
      throw new TypeError('A valid Phaser camera is required.');
    }
    this.camera = camera;
    this.config = config;
    this.orientation = normalizeDegrees(config.initialRotationDegrees);
    this.allowed = new Set(config.allowedRotationDegrees);
    if (!this.allowed.has(this.orientation)) {
      throw new RangeError('Initial camera orientation is not allowed.');
    }
  }

  setOrientation(degrees, duration = 250) {
    const target = normalizeDegrees(degrees);
    if (!this.allowed.has(target)) return false;
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError('Camera rotation duration must be a non-negative number.');
    }

    this.orientation = target;
    this.camera.rotateTo(
      target * (Math.PI / 180),
      true,
      duration,
      'Sine.easeInOut'
    );
    return true;
  }

  rotateQuarterTurn(direction = 1, duration = 250) {
    if (!Number.isInteger(direction) || direction === 0) {
      throw new TypeError('Rotation direction must be a non-zero integer.');
    }
    const next = normalizeDegrees(this.orientation + (Math.sign(direction) * 90));
    return this.setOrientation(next, duration);
  }

  setZoom(value) {
    const { min, max } = this.config.zoom;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
      return false;
    }
    if (!Number.isFinite(value)) return false;
    this.camera.setZoom(Math.min(max, Math.max(min, value)));
    return true;
  }
}
