/** Image-backed button; its text and touch interaction remain independent. */
export default class MenuButton {
  constructor(scene, { x, y, width = 220, height = 55, label = '', onClick = () => {}, depth = 4020, texture = 'ui-button-400' } = {}) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.background = scene.add.image(x, y, texture)
      .setDisplaySize(width, height).setScrollFactor(0).setDepth(depth).setInteractive();
    this.label = scene.add.text(x, y, label, {
      fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
      fontSize: Math.max(14, Math.min(19, height * 0.44)) + 'px',
      fontStyle: 'bold',
      color: '#fff2d2',
      stroke: '#35100b',
      strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 1, color: '#1b0705', blur: 1, fill: true },
      align: 'center',
      wordWrap: { width: width * 0.78 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setResolution(2);
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

  setAlpha(value) {
    this.background?.setAlpha(value);
    this.label?.setAlpha(value);
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
