import MenuButton from '../components/MenuButton.js';
import StatusBars from './StatusBars.js';

export default class PlayerHUD {
  constructor(scene, { onMenu = () => {} } = {}) {
    this.scene = scene;
    this.menuButton = new MenuButton(scene, {
      x: 54, y: 34, width: 92, height: 42, label: 'MENU', onClick: onMenu, depth: 3000
    });
    this.statusBars = new StatusBars(scene);
    this.layout();
  }

  setPlayer(player) {
    this.statusBars.setValues(player.health, player.maxHealth, player.energy, player.maxEnergy);
  }

  layout() {
    if (!this.scene) return;
    this.menuButton?.setPosition(54, 34);
    this.statusBars?.layout();
  }

  containsScreenPoint(x, y) {
    return this.menuButton?.containsScreenPoint(x, y) ||
      this.statusBars?.containsScreenPoint(x, y) || false;
  }

  destroy() {
    this.menuButton?.destroy();
    this.statusBars?.destroy();
    this.menuButton = null;
    this.statusBars = null;
    this.scene = null;
  }
}
