import PanelFrame from '../components/PanelFrame.js';

export default class MenuPanel {
  constructor(scene, { close = () => {}, openPanel = () => {} } = {}) {
    this.scene = scene;
    this.frame = new PanelFrame(scene, { title: 'MENU PRINCIPAL', width: 560, height: 420, variant: 'wide', close });
    const { x, y, width, height } = this.frame;
    const entries = [
      ['Bestiário', 'bestiary'],
      ['Waifus', 'waifus'],
      ['Inventário', 'inventory'],
      ['Casa', 'house']
    ];
    const buttonWidth = Math.min(190, width * 0.36);
    const buttonHeight = buttonWidth / 4;
    const columns = [x + width * 0.33, x + width * 0.67];
    const rows = [y + height * 0.39, y + height * 0.62];

    entries.forEach(([label, key], index) => {
      const row = Math.floor(index / 2);
      const column = index % 2;
      this.frame.addButton({
        x: columns[column], y: rows[row], width: buttonWidth, height: buttonHeight,
        label, onClick: () => openPanel(key)
      });
    });

    const monitor = scene.scene.get('Game')?.performanceMonitor;
    const enabled = Boolean(monitor?.enabled);
    this.monitorButton = this.frame.addButton({
      x: x + width / 2, y: y + height * 0.82, width: buttonWidth, height: buttonHeight,
      label: 'Desempenho: ' + (enabled ? 'ATIVO' : 'DESATIVADO'),
      onClick: () => {
        const next = !Boolean(monitor?.enabled);
        monitor?.setEnabled(next);
        this.monitorButton?.setText('Desempenho: ' + (next ? 'ATIVO' : 'DESATIVADO'));
      }
    });
  }

  destroy() {
    this.frame?.destroy();
    this.frame = null;
    this.scene = null;
  }
}
