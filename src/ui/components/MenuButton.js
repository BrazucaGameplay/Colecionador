/** Reusable vector button placeholder; later replace its background with supplied texture. */
export default class MenuButton {
  constructor(scene, { x, y, width = 220, height = 42, label = '', onClick = () => {}, depth = 4020 } = {}) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.background = scene.add.rectangle(x, y, width, height, 0x33251f, 0.98)
      .setStrokeStyle(2, 0xb99154, 1).setScrollFactor(0).setDepth(depth).setInteractive();
    this.label = scene.add.text(x, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold',
      color: '#f8e8c8', stroke: '#21130e', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.pointerHandler = (pointer, localX, localY, event) => {
      event?.stopPropagation();
      onClick();
    };
    this.background.on('pointerdown', this.pointerHandler);
  }

  setPosition(x, y) {
    this.background?.setPosition(x, y);
    this.label?.setPosition(x, y);
  }

  setText(value) {
    this.label?.setText(value);
  }

  containsScreenPoint(x, y) {
    return Boolean(this.background) && Math.abs(x - this.background.x) <= this.width / 2 &&
      Math.abs(y - this.background.y) <= this.height / 2;
  }

  destroy() {
    this.background?.off('pointerdown', this.pointerHandler);
    this.background?.destroy();
    this.label?.destroy();
    this.background = null;
    this.label = null;
    this.scene = null;
  }
}
