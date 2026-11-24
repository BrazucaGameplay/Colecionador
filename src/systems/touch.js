export default class TouchControls {
  constructor(scene) {
      this.vector = { x: 0, y: 0 };
          this.activeId = null; this.start = { x: 0, y: 0 };
              this.base = scene.add.circle(0, 0, 55, 0xffffff, 0.12).setScrollFactor(0).setVisible(false).setDepth(10);
                  this.knob = scene.add.circle(0, 0, 24, 0xffffff, 0.35).setScrollFactor(0).setVisible(false).setDepth(11);
                      scene.input.on('pointerdown', p => { if (this.activeId !== null) return; this.activeId = p.id; this.start = { x: p.x, y: p.y }; this.base.setPosition(p.x, p.y).setVisible(true); this.knob.setPosition(p.x, p.y).setVisible(true); });
                          scene.input.on('pointermove', p => { if (p.id !== this.activeId) return; const dx = p.x - this.start.x, dy = p.y - this.start.y; const len = Math.hypot(dx, dy) || 1; const cl = Math.min(len, 50); this.knob.setPosition(this.start.x + dx / len * cl, this.start.y + dy / len * cl); this.vector = { x: dx / len * (cl / 50), y: dy / len * (cl / 50) }; });
                              const end = p => { if (p.id !== this.activeId) return; this.activeId = null; this.vector = { x: 0, y: 0 }; this.base.setVisible(false); this.knob.setVisible(false); };
                                  scene.input.on('pointerup', end); scene.input.on('pointercancel', end);
                                    }
                                    }