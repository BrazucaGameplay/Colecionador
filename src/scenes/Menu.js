import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
    this.menuItems = [];
  }

  create() {
    this.showMainMenu();
  }

  clearMenu() {
    for (const item of this.menuItems) item.destroy();
    this.menuItems.length = 0;
  }

  addMenuButton(x, y, label, onClick, { disabled = false, width = 240 } = {}) {
    const fill = disabled ? 0x334155 : 0x166534;
    const rect = this.add.rectangle(x, y, width, 48, fill)
      .setStrokeStyle(1, disabled ? 0x64748b : 0x86efac);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: disabled ? '#94a3b8' : '#f8fafc',
      align: 'center'
    }).setOrigin(0.5);
    this.menuItems.push(rect, text);

    if (!disabled) {
      rect.setInteractive({ useHandCursor: true })
        .on('pointerover', () => rect.setFillStyle(0x15803d))
        .on('pointerout', () => rect.setFillStyle(fill))
        .on('pointerdown', onClick);
      text.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    }
    return rect;
  }

  showMainMenu() {
    this.clearMenu();
    const { width, height } = this.scale;
    this.menuItems.push(this.add.rectangle(0, 0, width, height, 0x0b0f1a).setOrigin(0));
    this.menuItems.push(this.add.text(width / 2, height * 0.28, 'COLECIONADOR', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#f8fafc'
    }).setOrigin(0.5));
    this.menuItems.push(this.add.text(width / 2, height * 0.37, 'A aventura começa aqui', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5));

    this.addMenuButton(width / 2, height * 0.62, 'JOGAR', () => this.scene.start('Game'));
  }

}
