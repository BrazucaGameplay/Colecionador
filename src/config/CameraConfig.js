export const CAMERA_CONFIG = Object.freeze({
  mode: 'hybrid',
  initialRotationDegrees: 0,
  allowedRotationDegrees: Object.freeze([0, 90, 180, 270]),
  zoom: Object.freeze({
    initial: 1,
    min: null,
    max: null,
    status: 'pending-visual-validation'
  }),
  follow: Object.freeze({
    enabled: true,
    smoothing: null,
    status: 'pending-tuning'
  })
});
