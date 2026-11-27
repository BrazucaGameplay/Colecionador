import PanelFrame from '../components/PanelFrame.js';

export default class MenuPanel {
  constructor(scene, { close = () => {}, openPanel = () => {} } = {}) {
    this.scene = scene;
    this.frame = new PanelFrame(scene, { title: 'MENU PRINCIPAL', width: 340, height: 390, close });
    const { x, y, width } = this.frame;
    const entries = [
      ['Perfil do jogador', 'profile'],
      ['Bestiário', 'bestiary'],
      ['Waifus', 'waifus'],
      ['Inventário', 'inventory'],
      ['Casa', 'house']
    ];
    const startY = y + 104;
    const gap = Math.min(48, (this.frame.height - 128) / entries.length);
    entries.forEach(([label, key], index) => {
      this.frame.addButton({
        x: x + width / 2, y: startY + index * gap,
        width: width - 48, height: Math.min(42, gap - 5),
        label, onClick: () => openPanel(key)
      });
    });
    const monitor = scene.scene.get('Game')?.performanceMonitor;
    const enabled = Boolean(monitor?.enabled);
    this.monitorButton = this.frame.addButton({
      x: x + width / 2, y: y + this.frame.height - 29,
      width: width - 48, height: 32,
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
