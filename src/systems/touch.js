export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.vector = { x: 0, y: 0 };
    this.activeId = null;
    this.start = { x: 0, y: 0 };
    this.destroyed = false;
    this.base = scene.add.circle(0, 0, 55, 0xffffff, 0.12).setScrollFactor(0).setVisible(false).setDepth(10);
    this.knob = scene.add.circle(0, 0, 24, 0xffffff, 0.35).setScrollFactor(0).setVisible(false).setDepth(11);
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerEnd = this.handlePointerEnd.bind(this);
    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerEnd);
    scene.input.on('pointercancel', this.onPointerEnd);
  }

  handlePointerDown(pointer) {
    if (this.destroyed || this.activeId !== null) return;
    this.activeId = pointer.id;
    this.start = { x: pointer.x, y: pointer.y };
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.knob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  handlePointerMove(pointer) {
    if (this.destroyed || pointer.id !== this.activeId) return;
    const dx = pointer.x - this.start.x;
    const dy = pointer.y - this.start.y;
    const length = Math.hypot(dx, dy) || 1;
    const clampedLength = Math.min(length, 50);
    this.knob.setPosition(this.start.x + (dx / length) * clampedLength, this.start.y + (dy / length) * clampedLength);
    this.vector = { x: (dx / length) * (clampedLength / 50), y: (dy / length) * (clampedLength / 50) };
  }

  handlePointerEnd(pointer) {
    if (this.destroyed || pointer.id !== this.activeId) return;
    this.activeId = null;
    this.vector = { x: 0, y: 0 };
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerEnd);
    this.scene.input.off('pointercancel', this.onPointerEnd);
    this.vector = { x: 0, y: 0 };
    this.activeId = null;
    this.base.destroy();
    this.knob.destroy();
  }
}
