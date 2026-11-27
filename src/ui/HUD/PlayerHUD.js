import MenuButton from '../components/MenuButton.js';
import PlayerPortrait from './PlayerPortrait.js';
import StatusBars from './StatusBars.js';

export default class PlayerHUD {
  constructor(scene, { onMenu = () => {}, onProfile = () => {} } = {}) {
    this.scene = scene;
    this.menuButton = new MenuButton(scene, {
      x: 76, y: 29, width: 132, height: 33, label: 'MENU',
      onClick: onMenu, depth: 3000, texture: 'ui-button-menu'
    });
    this.statusBars = new StatusBars(scene);
    this.portrait = new PlayerPortrait(scene, { onClick: onProfile });
    this.layout();
  }

  setPlayer(player) {
    this.statusBars.setValues(player.health, player.maxHealth, player.energy, player.maxEnergy);
  }

  layout() {
    if (!this.scene) return;
    this.menuButton?.setPosition(76, 29);
    this.statusBars?.layout();
    this.portrait?.layout(this.statusBars);
  }

  containsScreenPoint(x, y) {
    return this.menuButton?.containsScreenPoint(x, y) ||
      this.portrait?.containsScreenPoint(x, y) ||
      this.statusBars?.containsScreenPoint(x, y) || false;
  }

  destroy() {
    this.menuButton?.destroy();
    this.portrait?.destroy();
    this.statusBars?.destroy();
    this.menuButton = null;
    this.portrait = null;
    this.statusBars = null;
    this.scene = null;
  }
}
