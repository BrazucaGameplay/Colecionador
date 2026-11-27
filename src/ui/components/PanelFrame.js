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
      fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
      fontSize: Math.max(17, Math.min(23, this.width * 0.043)) + 'px',
      fontStyle: 'bold',
      color: '#ffe8b3',
      stroke: '#4b160d',
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#210805', blur: 1, fill: true },
      align: 'center',
      wordWrap: { width: this.width * 0.66 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4012).setResolution(3);
    this.objects.push(heading);

    const closeDiameter = Math.max(36, Math.min(46, this.width * 0.075));
    this.closeButton = new MenuButton(scene, {
      // Botão circular sobre o canto superior direito da moldura, fora da área do título.
      x: this.x + this.width * 0.99,
      y: this.y + this.height * 0.075,
      width: closeDiameter,
      height: closeDiameter,
      label: '×', onClick: close, depth: 4020, shape: 'circle'
    });
    this.objects.push(this.closeButton);
  }

  addText(x, y, value, style = {}) {
    const object = this.scene.add.text(x, y, value, {
      fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
      fontSize: '14px',
      color: '#fff0dc',
      wordWrap: { width: this.content.width },
      lineSpacing: 5,
      stroke: '#35110e',
      strokeThickness: 1,
      shadow: { offsetX: 1, offsetY: 1, color: '#1c0806', blur: 1, fill: true },
      ...style
    }).setScrollFactor(0).setDepth(4022).setResolution(3);
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
