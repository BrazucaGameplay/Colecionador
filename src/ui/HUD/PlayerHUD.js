import MenuButton from '../components/MenuButton.js';
import StatusBars from './StatusBars.js';

export default class PlayerHUD {
  constructor(scene, { onMenu = () => {} } = {}) {
    this.scene = scene;
    this.menuButton = new MenuButton(scene, {
      x: 70, y: 28, width: 120, height: 30, label: 'MENU',
      onClick: onMenu, depth: 3000, texture: 'ui-button-menu'
    });
    this.statusBars = new StatusBars(scene);
    this.layout();
  }

  setPlayer(player) {
    this.statusBars.setValues(player.health, player.maxHealth, player.energy, player.maxEnergy);
  }

  layout() {
    if (!this.scene) return;
    this.menuButton?.setPosition(70, 28);
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
