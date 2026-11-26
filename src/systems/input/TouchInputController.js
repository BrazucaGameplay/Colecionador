const DEFAULT_TAP_THRESHOLD = 12;

/**
 * Owns screen touch gestures only. A short single-finger tap is emitted as a
 * world-navigation request; a drag pans the camera and two fingers pinch-zoom.
 * Pinch zoom is anchored to the midpoint between the active pointers.
 */
export default class TouchInputController {
  constructor(scene, {
    camera,
    onTap,
    onPan,
    isUiPointer = () => false,
    tapThreshold = DEFAULT_TAP_THRESHOLD,
    getMinZoom = () => 0.08,
    maxZoom = 2.25,
    clampCamera = () => {}
  } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.onTap = onTap;
    this.onPan = onPan;
    this.isUiPointer = isUiPointer;
    this.tapThreshold = tapThreshold;
    this.getMinZoom = getMinZoom;
    this.maxZoom = maxZoom;
    this.clampCamera = clampCamera;
    this.pointers = new Map();
    this.gesture = null;

    scene.input.addPointer(1);
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('pointerupoutside', this.onPointerUp, this);
  }

  getPinchMetrics() {
    const points = [...this.pointers.values()];
    if (points.length < 2) return null;
    const midpointX = (points[0].x + points[1].x) / 2;
    const midpointY = (points[0].y + points[1].y) / 2;
    return {
      distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
      midpointX,
      midpointY
    };
  }

  beginPinch() {
    const metrics = this.getPinchMetrics();
    if (!metrics) return;

    this.camera.stopFollow();
    this.onPan?.();
    this.gesture = {
      type: 'pinch',
      startDistance: metrics.distance,
      startZoom: this.camera.zoom
    };
  }

  onPointerDown(pointer) {
    if (this.isUiPointer?.(pointer.x, pointer.y)) return;
    this.pointers.set(pointer.id, {
      x: pointer.x,
      y: pointer.y,
      startX: pointer.x,
      startY: pointer.y,
      moved: false
    });

    if (this.pointers.size === 1) {
      this.gesture = {
        type: 'pending',
        pointerId: pointer.id,
        lastX: pointer.x,
        lastY: pointer.y
      };
    } else if (this.pointers.size === 2) {
      this.beginPinch();
    }
  }

  onPointerMove(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;

    point.x = pointer.x;
    point.y = pointer.y;
    if (Math.hypot(pointer.x - point.startX, pointer.y - point.startY) > this.tapThreshold) {
      point.moved = true;
    }

    if (this.pointers.size >= 2) {
      const metrics = this.getPinchMetrics();
      if (this.gesture?.type !== 'pinch' || !metrics || this.gesture.startDistance <= 0) return;

      const minZoom = Math.min(this.maxZoom, Math.max(0.01, this.getMinZoom()));
      const nextZoom = Math.min(this.maxZoom, Math.max(
        minZoom,
        this.gesture.startZoom * metrics.distance / this.gesture.startDistance
      ));

      // Preserve the exact world point under the fingers while changing scale.
      const anchorBefore = this.camera.getWorldPoint(metrics.midpointX, metrics.midpointY);
      this.camera.setZoom(nextZoom);
      const anchorAfter = this.camera.getWorldPoint(metrics.midpointX, metrics.midpointY);
      this.camera.scrollX += anchorBefore.x - anchorAfter.x;
      this.camera.scrollY += anchorBefore.y - anchorAfter.y;
      this.clampCamera();
      return;
    }

    if (this.gesture?.pointerId !== pointer.id || !point.moved) return;
    if (this.gesture.type !== 'pan') {
      // A finger left after a pinch must cross the normal drag threshold first.
      this.camera.stopFollow();
      this.gesture.type = 'pan';
      this.onPan?.();
    }
    this.camera.scrollX -= (pointer.x - this.gesture.lastX) / this.camera.zoom;
    this.camera.scrollY -= (pointer.y - this.gesture.lastY) / this.camera.zoom;
    this.gesture.lastX = pointer.x;
    this.gesture.lastY = pointer.y;
    this.clampCamera();
  }

  onPointerUp(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;

    const isTap = this.pointers.size === 1 &&
      !point.moved &&
      this.gesture?.type === 'pending';

    if (isTap) this.onTap?.(pointer.x, pointer.y);

    this.pointers.delete(pointer.id);
    if (this.pointers.size === 0) {
      this.gesture = null;
    } else if (this.pointers.size === 1) {
      const [id, remaining] = [...this.pointers.entries()][0];
      this.gesture = {
        type: 'pending-pan',
        pointerId: id,
        lastX: remaining.x,
        lastY: remaining.y
      };
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = false;
    }
  }

  destroy() {
    if (!this.scene) return;
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);
    this.pointers.clear();
    this.gesture = null;
    this.scene = null;
    this.camera = null;
    this.onTap = null;
    this.onPan = null;
    this.isUiPointer = null;
    this.getMinZoom = null;
    this.clampCamera = null;
  }
}
