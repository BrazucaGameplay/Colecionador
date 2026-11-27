import MenuButton from '../components/MenuButton.js';
import StatusBars from './StatusBars.js';
import { setPortraitTexture } from './PortraitDisplay.js';

const HUD_PORTRAIT_MAX_WIDTH = 72;
const HUD_PORTRAIT_MAX_HEIGHT = 96;
const HUD_PORTRAIT_CENTER_OFFSET_Y = 54;

export default class PlayerHUD {
  constructor(scene, { onMenu = () => {}, onProfile = () => {} } = {}) {
    this.scene = scene;
    this.onProfile = onProfile;
    this.menuButton = new MenuButton(scene, {
      x: 78, y: 30, width: 132, height: 33, label: 'MENU',
      onClick: onMenu, depth: 3000, texture: 'ui-button-menu'
    });
    this.statusBars = new StatusBars(scene);
    // Retrato maior para preservar os detalhes; permanece acima das barras.
    this.portrait = scene.add.image(0, 0, 'player-portrait')
      .setScrollFactor(0).setDepth(3004).setInteractive();
    setPortraitTexture(this.portrait, 'player-portrait', HUD_PORTRAIT_MAX_WIDTH, HUD_PORTRAIT_MAX_HEIGHT);
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
      setPortraitTexture(this.portrait, textureKey, HUD_PORTRAIT_MAX_WIDTH, HUD_PORTRAIT_MAX_HEIGHT);
    }
  }

  layout() {
    if (!this.scene) return;
    this.menuButton?.setPosition(78, 30);
    this.statusBars?.layout();
    if (this.portrait && this.statusBars) {
      this.portrait.setPosition(this.scene.scale.width / 2, this.statusBars.top - HUD_PORTRAIT_CENTER_OFFSET_Y);
    }
  }

  containsScreenPoint(x, y) {
    return this.menuButton?.containsScreenPoint(x, y) ||
      (this.portrait && Math.abs(x - this.portrait.x) <= HUD_PORTRAIT_MAX_WIDTH / 2 + 4 &&
        Math.abs(y - this.portrait.y) <= HUD_PORTRAIT_MAX_HEIGHT / 2 + 4) ||
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
