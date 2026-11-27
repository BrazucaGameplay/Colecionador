import MenuButton from '../components/MenuButton.js';
import StatusBars from './StatusBars.js';

export default class PlayerHUD {
  constructor(scene, { onMenu = () => {}, onProfile = () => {} } = {}) {
    this.scene = scene;
    this.onProfile = onProfile;
    this.menuButton = new MenuButton(scene, {
      x: 78, y: 30, width: 132, height: 33, label: 'MENU',
      onClick: onMenu, depth: 3000, texture: 'ui-button-menu'
    });
    this.statusBars = new StatusBars(scene);
    // Silhueta transparente centralizada logo acima das barras.
    this.portrait = scene.add.image(0, 0, 'player-portrait')
      .setDisplaySize(48, 72).setScrollFactor(0).setDepth(3004).setInteractive();
    this.portrait.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.onProfile();
    });
    this.layout();
  }

  setPlayer(player) {
    this.statusBars.setValues(player.health, player.maxHealth, player.energy, player.maxEnergy);
  }

  setPortrait(textureKey) {
    if (textureKey && this.scene?.textures?.exists(textureKey)) {
      this.portrait?.setTexture(textureKey);
    }
  }

  layout() {
    if (!this.scene) return;
    this.menuButton?.setPosition(78, 30);
    this.statusBars?.layout();
    if (this.portrait && this.statusBars) {
      this.portrait.setPosition(this.scene.scale.width / 2, this.statusBars.top - 40);
    }
  }

  containsScreenPoint(x, y) {
    return this.menuButton?.containsScreenPoint(x, y) ||
      (this.portrait && Math.abs(x - this.portrait.x) <= 27 && Math.abs(y - this.portrait.y) <= 40) ||
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
