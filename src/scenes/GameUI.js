import * as Phaser from 'phaser';
import PlayerHUD from '../ui/HUD/PlayerHUD.js';
import MenuPanel from '../ui/panels/MenuPanel.js';
import ProfilePanel from '../ui/panels/ProfilePanel.js';
import BestiaryPanel from '../ui/panels/BestiaryPanel.js';
import WaifuPanel from '../ui/panels/WaifuPanel.js';
import InventoryPanel from '../ui/panels/InventoryPanel.js';
import HousePanel from '../ui/panels/HousePanel.js';

const UI_ASSETS = [
  ['ui-panel-vertical', 'panels/painel_vertical_900x1350_transparente.webp'],
  ['ui-panel-profile', 'panels/perfil_moldura_fundo_vermelho.webp'],
  ['ui-button-menu', 'buttons/botao_menu_400x100_transparente.webp'],
  ['ui-button-200', 'buttons/botao_sem_ornamento_central_200x100.webp'],
  ['ui-button-300', 'buttons/botao_sem_ornamento_central_300x100.webp'],
  ['ui-button-400', 'buttons/botao_sem_ornamento_central_400x100.webp'],
  ['ui-close-button', 'buttons/fechar_circular.svg'],
  ['ui-hud-status', 'hud/moldura_hp_energia_sem_barras_600px.webp'],
  ['player-portrait', 'player-portrait.webp'],
  ['skin-portrait-skin_2', '../characters/sprites/skin_2/perfil.webp']
];

export default class GameUI extends Phaser.Scene {
  constructor() {
    super('GameUI');
    this.activePanel = null;
    this.panelShade = null;
    this.refreshElapsed = 0;
  }

  preload() {
    const base = import.meta.env.BASE_URL + 'assets/ui/';
    for (const [key, path] of UI_ASSETS) {
      const url = path.startsWith('../') ? import.meta.env.BASE_URL + 'assets/' + path.slice(3) : base + path;
      this.load.image(key, url + '?v=20261127-ui-art-v5');
    }
    this.load.on('loaderror', file => console.error('Falha ao carregar arte da interface:', file.key, file.src));
  }

  create() {
    this.gameScene = this.scene.get('Game');
    this.gameScene.uiScene = this;
    this.input.setGlobalTopOnly(false);
    this.hud = new PlayerHUD(this, {
      onMenu: () => this.activePanel?.key === 'menu' ? this.closePanel() : this.openPanel('menu'),
      onProfile: () => this.openPanel('profile')
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
