import * as Phaser from 'phaser';
import PlayerHUD from '../ui/HUD/PlayerHUD.js';
import MenuPanel from '../ui/panels/MenuPanel.js';
import ProfilePanel from '../ui/panels/ProfilePanel.js';
import BestiaryPanel from '../ui/panels/BestiaryPanel.js';
import WaifuPanel from '../ui/panels/WaifuPanel.js';
import InventoryPanel from '../ui/panels/InventoryPanel.js';
import HousePanel from '../ui/panels/HousePanel.js';

export default class GameUI extends Phaser.Scene {
  constructor() {
    super('GameUI');
    this.activePanel = null;
    this.panelShade = null;
    this.refreshElapsed = 0;
  }

  create() {
    this.gameScene = this.scene.get('Game');
    this.gameScene.uiScene = this;
    this.input.setGlobalTopOnly(false);
    this.hud = new PlayerHUD(this, {
      onMenu: () => this.activePanel?.key === 'menu' ? this.closePanel() : this.openPanel('menu')
    });
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.refreshHud();
  }

  isUiPointer(x, y) {
    return Boolean(this.activePanel) || Boolean(this.hud?.containsScreenPoint(x, y));
  }

  refreshHud() {
    const player = this.gameScene?.player;
    if (!player || !this.hud) return;
    this.hud.setPlayer(player);
    this.activePanel?.refresh?.();
  }

  openPanel(key) {
    this.closePanel();
    this.panelShade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x050914, 0.72)
      .setOrigin(0).setScrollFactor(0).setDepth(3990).setInteractive();
    this.panelShade.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.closePanel();
    });

    const close = () => this.closePanel();
    const panels = {
      menu: () => new MenuPanel(this, { close, openPanel: name => this.openPanel(name) }),
      profile: () => new ProfilePanel(this, { close, gameScene: this.gameScene }),
      bestiary: () => new BestiaryPanel(this, { close }),
      waifus: () => new WaifuPanel(this, { close }),
      inventory: () => new InventoryPanel(this, { close }),
      house: () => new HousePanel(this, { close })
    };
    const create = panels[key];
    if (!create) {
      this.panelShade.destroy();
      this.panelShade = null;
      return;
    }
    this.activePanel = create();
    this.activePanel.key = key;
  }

  closePanel() {
    this.activePanel?.destroy?.();
    this.activePanel = null;
    this.panelShade?.destroy();
    this.panelShade = null;
  }

  handleResize() {
    this.closePanel();
    this.hud?.layout();
  }

  update(time, delta = 16.67) {
    this.refreshElapsed += Math.max(0, delta);
    if (this.refreshElapsed < 100) return;
    this.refreshElapsed = 0;
    this.refreshHud();
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.closePanel();
    this.hud?.destroy();
    this.hud = null;
    if (this.gameScene?.uiScene === this) this.gameScene.uiScene = null;
    this.gameScene = null;
  }
}
