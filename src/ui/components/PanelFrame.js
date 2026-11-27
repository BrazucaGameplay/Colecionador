import MenuButton from './MenuButton.js';

const PANEL_TEXTURES = {
  vertical: { key: 'ui-panel-vertical', ratio: 956 / 1406 },
  wide: { key: 'ui-panel-profile', ratio: 1383 / 947 }
};

/** Fits the supplied artwork to the viewport without distorting its aspect ratio. */
export default class PanelFrame {
  constructor(scene, { title, width = 360, height = 520, variant = 'vertical', close = () => {} } = {}) {
    this.scene = scene;
    this.objects = [];
    const art = PANEL_TEXTURES[variant] || PANEL_TEXTURES.vertical;
    const screenWidth = scene.scale.width;
    const screenHeight = scene.scale.height;
    const maxWidth = Math.max(1, Math.min(width, screenWidth - 24));
    const maxHeight = Math.max(1, Math.min(height, screenHeight - 24));
    this.width = Math.min(maxWidth, maxHeight * art.ratio);
    this.height = this.width / art.ratio;
    this.x = (screenWidth - this.width) / 2;
    this.y = (screenHeight - this.height) / 2;
    this.content = {
      left: this.x + this.width * 0.14,
      right: this.x + this.width * 0.86,
      top: this.y + this.height * 0.22,
      bottom: this.y + this.height * 0.82,
      width: this.width * 0.72,
      height: this.height * 0.60
    };

    this.background = scene.add.image(this.x + this.width / 2, this.y + this.height / 2, art.key)
      .setDisplaySize(this.width, this.height).setScrollFactor(0).setDepth(4010).setInteractive();
    this.background.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation());
    this.objects.push(this.background);

    const heading = scene.add.text(this.x + this.width / 2, this.y + this.height * 0.145, title || '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: Math.max(15, Math.min(22, this.width * 0.044)) + 'px',
      fontStyle: 'bold',
      color: '#ffe4a5',
      stroke: '#4b160d',
      strokeThickness: 4,
      resolution: 2,
      align: 'center',
      wordWrap: { width: this.width * 0.66 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4012);
    this.objects.push(heading);

    this.closeButton = new MenuButton(scene, {
      x: this.x + this.width * 0.86,
      y: this.y + this.height * 0.145,
      width: Math.max(30, this.width * 0.105),
      height: Math.max(18, this.width * 0.0525),
      label: '×', onClick: close, depth: 4020, texture: 'ui-button-200'
    });
    this.objects.push(this.closeButton);
  }

  addText(x, y, value, style = {}) {
    const object = this.scene.add.text(x, y, value, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '14px',
      color: '#fff0dc',
      wordWrap: { width: this.content.width },
      lineSpacing: 5,
      stroke: '#35110e',
      strokeThickness: 1,
      resolution: 2,
      ...style
    }).setScrollFactor(0).setDepth(4022);
    this.objects.push(object);
    return object;
  }

  addButton({ x, y, width = this.content.width, label, onClick, height = width / 4, texture = 'ui-button-400' }) {
    const button = new MenuButton(this.scene, { x, y, width, height, label, onClick, depth: 4025, texture });
    this.objects.push(button);
    return button;
  }

  destroy() {
    for (const object of this.objects) object?.destroy?.();
    this.objects.length = 0;
    this.scene = null;
  }
}
