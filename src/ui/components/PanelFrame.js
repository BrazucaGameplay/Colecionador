import MenuButton from './MenuButton.js';

export default class PanelFrame {
  constructor(scene, { title, width = 360, height = 390, close = () => {} } = {}) {
    this.scene = scene;
    this.objects = [];
    const screenWidth = scene.scale.width;
    const screenHeight = scene.scale.height;
    this.width = Math.min(width, screenWidth - 24);
    this.height = Math.min(height, screenHeight - 24);
    this.x = (screenWidth - this.width) / 2;
    this.y = (screenHeight - this.height) / 2;

    this.background = scene.add.rectangle(this.x + this.width / 2, this.y + this.height / 2,
      this.width, this.height, 0x171923, 0.99)
      .setStrokeStyle(2, 0xb99154, 1).setScrollFactor(0).setDepth(4010).setInteractive();
    this.background.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation());
    this.objects.push(this.background);
    const header = scene.add.rectangle(this.x + this.width / 2, this.y + 29,
      this.width - 4, 54, 0x30221f, 1).setScrollFactor(0).setDepth(4011);
    this.objects.push(header);
    const heading = scene.add.text(this.x + 18, this.y + 29, title || '', {
      fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold',
      color: '#f6d99f', stroke: '#21130e', strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(4012);
    this.objects.push(heading);
    this.closeButton = new MenuButton(scene, {
      x: this.x + this.width - 30, y: this.y + 29, width: 42, height: 34,
      label: '×', onClick: close, depth: 4020
    });
    this.objects.push(this.closeButton);
  }

  addText(x, y, value, style = {}) {
    const object = this.scene.add.text(x, y, value, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#eee6d9',
      wordWrap: { width: this.width - 44 }, lineSpacing: 5, ...style
    }).setScrollFactor(0).setDepth(4022);
    this.objects.push(object);
    return object;
  }

  addButton({ x, y, width = this.width - 52, label, onClick, height = 42 }) {
    const button = new MenuButton(this.scene, { x, y, width, height, label, onClick, depth: 4025 });
    this.objects.push(button);
    return button;
  }

  destroy() {
    for (const object of this.objects) object?.destroy?.();
    this.objects.length = 0;
    this.scene = null;
  }
}
