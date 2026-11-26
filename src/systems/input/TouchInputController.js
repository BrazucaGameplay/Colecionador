const DEFAULT_TAP_THRESHOLD = 12;

/**
 * Owns screen touch gestures only. A short single-finger tap is emitted as a
 * world-navigation request; a drag pans the camera and two fingers pinch-zoom.
 * It never reads other input devices and never moves the player directly.
 */
export default class TouchInputController {
  constructor(scene, { camera, onTap, onPan, isUiPointer = () => false, tapThreshold = DEFAULT_TAP_THRESHOLD } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.onTap = onTap;
    this.onPan = onPan;
    this.isUiPointer = isUiPointer;
    this.tapThreshold = tapThreshold;
    this.pointers = new Map();
    this.gesture = null;

    scene.input.addPointer(1);
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('pointerupoutside', this.onPointerUp, this);
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
      const points = [...this.pointers.values()];
      this.gesture = {
        type: 'pinch',
        startDistance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        startZoom: this.camera.zoom
      };
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
      const points = [...this.pointers.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (this.gesture?.type === 'pinch' && this.gesture.startDistance > 0) {
        this.camera.setZoom(Math.min(2.25, Math.max(0.08,
          this.gesture.startZoom * distance / this.gesture.startDistance
        )));
      }
      return;
    }

    if (this.gesture?.pointerId !== pointer.id || !point.moved) return;
    if (this.gesture.type !== 'pan') {
      // O arraste assume temporariamente o controle da câmera.
      this.camera.stopFollow();
      this.gesture.type = 'pan';
      this.onPan?.();
    }
    this.camera.scrollX -= (pointer.x - this.gesture.lastX) / this.camera.zoom;
    this.camera.scrollY -= (pointer.y - this.gesture.lastY) / this.camera.zoom;
    this.gesture.lastX = pointer.x;
    this.gesture.lastY = pointer.y;
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
        type: 'pending',
        pointerId: id,
        lastX: remaining.x,
        lastY: remaining.y
      };
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = true;
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
  }
}
