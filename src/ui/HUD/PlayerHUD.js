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

    // Retrato original restaurado como atalho tátil para o perfil do jogador.
    this.portraitFrame = scene.add.rectangle(0, 0, 42, 58, 0x3b120d, 0.96)
      .setStrokeStyle(2, 0xe8b64e).setScrollFactor(0).setDepth(3000);
    this.portrait = scene.add.image(0, 0, 'player-portrait')
      .setDisplaySize(36, 52).setScrollFactor(0).setDepth(3001).setInteractive();
    this.portrait.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.onProfile();
    });

    this.statusBars = new StatusBars(scene);
    this.layout();
  }

  setPlayer(player) {
    this.statusBars.setValues(player.health, player.maxHealth, player.energy, player.maxEnergy);
  }

  layout() {
    if (!this.scene) return;
    const width = this.scene.scale.width;
    this.menuButton?.setPosition(78, 30);
    this.portraitFrame?.setPosition(width - 34, 42);
    this.portrait?.setPosition(width - 34, 42);
    this.statusBars?.layout();
  }

  containsScreenPoint(x, y) {
    return this.menuButton?.containsScreenPoint(x, y) ||
      (this.portrait && Math.abs(x - this.portrait.x) <= 23 && Math.abs(y - this.portrait.y) <= 31) ||
      this.statusBars?.containsScreenPoint(x, y) || false;
  }

  destroy() {
    this.menuButton?.destroy();
    this.portraitFrame?.destroy();
    this.portrait?.destroy();
    this.statusBars?.destroy();
    this.menuButton = null;
    this.portraitFrame = null;
    this.portrait = null;
    this.statusBars = null;
    this.scene = null;
  }
}
