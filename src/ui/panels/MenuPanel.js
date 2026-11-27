import PanelFrame from '../components/PanelFrame.js';

export default class MenuPanel {
  constructor(scene, { close = () => {}, openPanel = () => {} } = {}) {
    this.scene = scene;
    this.frame = new PanelFrame(scene, { title: 'MENU PRINCIPAL', width: 600, height: 460, variant: 'wide', close });
    const { x, y, width, height } = this.frame;
    const entries = [
      ['Bestiário', 'bestiary'],
      ['Waifus', 'waifus'],
      ['Inventário', 'inventory'],
      ['Casa', 'house']
    ];

    const buttonWidth = Math.min(200, width * 0.37);
    const buttonHeight = buttonWidth / 4;
    const columns = [x + width * 0.32, x + width * 0.68];
    const rows = [y + height * 0.39, y + height * 0.61];

    entries.forEach(([label, key], index) => {
      const row = Math.floor(index / 2);
      const column = index % 2;
      this.frame.addButton({
        x: columns[column],
        y: rows[row],
        width: buttonWidth,
        height: buttonHeight,
        label,
        onClick: () => openPanel(key)
      });
    });

    const monitor = scene.scene.get('Game')?.performanceMonitor;
    this.monitorButton = this.frame.addButton({
      x: x + width / 2,
      y: y + height * 0.805,
      width: Math.min(150, width * 0.30),
      height: Math.min(40, width * 0.08),
      label: 'FPS',
      texture: 'ui-button-200',
      onClick: () => monitor?.setEnabled(!Boolean(monitor?.enabled))
    });
  }

  destroy() {
    this.frame?.destroy();
    this.frame = null;
    this.scene = null;
  }
}
