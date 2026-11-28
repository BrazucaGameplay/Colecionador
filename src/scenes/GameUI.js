import '../ui/html-game-ui.css';
import * as Phaser from 'phaser';
import PlayerHUD from '../ui/HUD/PlayerHUD.js';
import HtmlGameUI from '../ui/HtmlGameUI.js';

const UI_ASSETS = [
  ['ui-button-menu', 'buttons/botao_menu_400x100_transparente.webp'],
  ['ui-hud-status', 'hud/moldura_hp_energia_sem_barras_600px.webp']
];

export default class GameUI extends Phaser.Scene {
  constructor() {
    super('GameUI');
    this.refreshElapsed = 0;
  }

  preload() {
    const base = import.meta.env.BASE_URL + 'assets/ui/';
    for (const [key, path] of UI_ASSETS) {
      this.load.image(key, base + path + '?v=20261127-html-ui-v1');
    }
    this.load.on('loaderror', file => console.error('Falha ao carregar arte da HUD:', file.key, file.src));
  }

  create() {
    this.gameScene = this.scene.get('Game');
    this.gameScene.uiScene = this;
    this.input.setGlobalTopOnly(false);
    this.htmlUI = new HtmlGameUI(this, {
      openMenu: () => this.htmlUI?.activePanel?.key === 'menu' ? this.htmlUI.closePanel() : this.htmlUI.openPanel('menu'),
      openProfile: () => this.htmlUI?.openPanel('profile')
    });
    this.hud = new PlayerHUD(this, {
      onMenu: () => this.htmlUI?.activePanel?.key === 'menu' ? this.htmlUI.closePanel() : this.htmlUI.openPanel('menu')
    });
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.refreshHud();
  }

  isUiPointer(x, y) {
    return Boolean(this.htmlUI?.isUiPointer(x, y)) || Boolean(this.hud?.containsScreenPoint(x, y));
  }

  refreshHud() {
    const player = this.gameScene?.player;
    if (!player || !this.hud) return;
    this.hud.setPlayer(player);
    this.htmlUI?.refresh();
  }

  openPanel(key) {
    this.htmlUI?.openPanel(key);
  }

  closePanel() {
    this.htmlUI?.closePanel();
  }

  handleResize() {
    this.htmlUI?.layout();
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
    this.htmlUI?.destroy();
    this.htmlUI = null;
    this.hud?.destroy();
    this.hud = null;
    if (this.gameScene?.uiScene === this) this.gameScene.uiScene = null;
    this.gameScene = null;
  }
}
