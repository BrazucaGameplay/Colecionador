const CAMERA_ZOOM = Object.freeze({ min: 0.2, max: 0.6, default: 0.4 });
const CAMERA_FOLLOW_LERP = 0.06;

/** Owns world-camera framing, follow, zoom limits and the screen-space HUD camera. */
export default class CameraController {
  constructor(scene) {
    if (!scene) throw new TypeError('CameraController precisa de uma cena.');
    this.scene = scene;
    this.camera = null;
    this.uiCamera = null;
    this.target = null;
    this.followActive = false;
  }

  initialize(target) {
    if (this.camera) throw new Error('CameraController já foi inicializado.');
    if (!target) throw new TypeError('CameraController precisa do sprite seguido.');
    const scene = this.scene;
    const bounds = scene.oceanBounds;
    if (!bounds) throw new Error('Os limites do oceano precisam existir antes da câmera.');
    this.target = target;
    this.camera = scene.cameras.main;
    this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.camera.roundPixels = true;
    this.camera.setZoom(Math.max(this.getMinimumZoom(), CAMERA_ZOOM.default));
    this.clampToWorld();
    this.followPlayer();
    return this.camera;
  }

  getMinimumZoom() { return CAMERA_ZOOM.min; }
  getMaximumZoom() { return CAMERA_ZOOM.max; }

  followPlayer() {
    if (!this.camera || !this.target || this.followActive) return;
    this.camera.startFollow(this.target, true, CAMERA_FOLLOW_LERP, CAMERA_FOLLOW_LERP);
    this.followActive = true;
  }

  handleManualPan() { this.followActive = false; }

  clampToWorld() {
    const bounds = this.scene?.oceanBounds;
    const camera = this.camera;
    if (!camera || !bounds) return;
    const visibleWidth = camera.width / camera.zoom;
    const visibleHeight = camera.height / camera.zoom;
    const maxScrollX = bounds.x + bounds.width - visibleWidth;
    const maxScrollY = bounds.y + bounds.height - visibleHeight;
    camera.scrollX = maxScrollX < bounds.x
      ? bounds.x + (bounds.width - visibleWidth) / 2
      : Math.max(bounds.x, Math.min(camera.scrollX, maxScrollX));
    camera.scrollY = maxScrollY < bounds.y
      ? bounds.y + (bounds.height - visibleHeight) / 2
      : Math.max(bounds.y, Math.min(camera.scrollY, maxScrollY));
  }

  createHudCamera(excludedLayer) {
    if (!this.camera || this.uiCamera) throw new Error('Câmera principal ausente ou HUD já criada.');
    const scene = this.scene;
    this.uiCamera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height, false);
    this.uiCamera.setZoom(1).setScroll(0, 0);
    this.uiCamera.roundPixels = true;
    this.camera.ignore(excludedLayer);
    this.uiCamera.ignore(scene.children.list.filter(child => child !== excludedLayer));
    scene.scale.on('resize', this.resize, this);
    return this.uiCamera;
  }

  resize(gameSize) {
    if (!this.uiCamera || !this.camera) return;
    const scene = this.scene;
    const width = gameSize?.width || scene.scale.width;
    const height = gameSize?.height || scene.scale.height;
    this.camera.setViewport(0, 0, width, height);
    this.uiCamera.setViewport(0, 0, width, height);
    scene.worldBootstrap.updateOceanBounds(width, height);
    const bounds = scene.oceanBounds;
    this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    if (this.camera.zoom < this.getMinimumZoom()) this.camera.setZoom(this.getMinimumZoom());
    this.clampToWorld();
  }

  destroy() {
    if (!this.scene) return;
    this.scene.scale.off('resize', this.resize, this);
    if (this.uiCamera) this.scene.cameras.remove(this.uiCamera);
    this.uiCamera = null;
    this.camera = null;
    this.target = null;
    this.followActive = false;
    this.scene = null;
  }
}
