import './html-game-ui.css';
import { CHARACTER_SKINS } from '../rendering/characters/CharacterSkinCatalog.js';
import ProfileImageFitter from './ProfileImageFitter.js';

const BASE = import.meta.env?.BASE_URL ?? '/';
const asset = path => BASE + path;
const UI = Object.freeze({
  vertical: asset('assets/ui/panels/painel_vertical_900x1350_transparente.webp'),
  wide: asset('assets/ui/panels/perfil_moldura_fundo_vermelho.webp'),
  close: asset('assets/ui/buttons/fechar_circular.svg'),
  button200: asset('assets/ui/buttons/botao_sem_ornamento_central_200x100.webp'),
  button300: asset('assets/ui/buttons/botao_sem_ornamento_central_300x100.webp'),
  button400: asset('assets/ui/buttons/botao_sem_ornamento_central_400x100.webp')
});
const INFO = Object.freeze({
  bestiary: ['BESTIÁRIO', 'Registros ainda não conectados', 'O catálogo de espécies será preenchido quando os encontros e as derrotas forem integrados ao sistema de bestiário.'],
  waifus: ['WAIFUS', 'Sistema de vínculos pendente', 'Este painel aguarda a integração dos cards, dos vínculos, dos presentes e das habilidades. Nenhum personagem ou bônus fictício será criado.'],
  inventory: ['INVENTÁRIO', 'Catálogo de itens pendente', 'O inventário será ativado quando o catálogo e as instâncias de itens estiverem conectados aos drops e ao salvamento.'],
  house: ['CASA', 'Sistema ainda não implementado', 'A casa aguarda os sistemas de construção, melhorias e armazenamento. Abrir este painel não consome recursos nem altera o mundo.']
});

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function imageButton(label, background, onClick, className = '') {
  const button = element('button', 'html-game-ui__button ' + className);
  button.type = 'button';
  if (background) {
    const img = element('img');
    img.src = background;
    img.alt = '';
    img.draggable = false;
    button.append(img);
  }
  const caption = element('span', '', label);
  button.append(caption);
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.();
  });
  return button;
}

/**
 * Native HTML layer for screen-space panels and player portraits.
 * Gameplay rendering, the menu trigger and status bars remain in Phaser.
 */
export default class HtmlGameUI {
  constructor(scene, { openMenu = () => {}, openProfile = () => {} } = {}) {
    this.scene = scene;
    this.gameScene = scene.scene.get('Game');
    this.openMenu = openMenu;
    this.openProfile = openProfile;
    this.activePanel = null;
    this.page = 0;
    this.lastPortrait = '';
    this.root = element('div', 'html-game-ui');
    this.root.setAttribute('aria-label', 'Interface do jogo');
    this.root.setAttribute('data-html-game-ui', 'true');

    const parent = document.getElementById('game');
    if (!parent) throw new Error('Container #game não encontrado para a interface HTML.');
    parent.append(this.root);

    this.portraitButton = element('button', 'html-game-ui__hud-portrait');
    this.portraitButton.type = 'button';
    this.portraitButton.setAttribute('aria-label', 'Abrir perfil do personagem');
    this.portraitFallback = element('span', 'html-game-ui__portrait-fallback');
    this.portraitFallback.setAttribute('aria-hidden', 'true');
    this.portraitImage = element('img', 'html-game-ui__portrait-image');
    this.portraitImage.alt = 'Retrato do personagem';
    this.portraitImage.draggable = false;
    this.portraitImage.addEventListener('load', () => { this.portraitFallback.hidden = true; });
    this.portraitImage.addEventListener('error', () => { this.portraitFallback.hidden = false; });
    this.portraitButton.append(this.portraitFallback, this.portraitImage);
    this.portraitButton.addEventListener('pointerdown', event => event.stopPropagation());
    this.portraitButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      this.openProfile();
    });
    this.root.append(this.portraitButton);
    this.layout();
    this.refresh();
  }

  getSelectedSkin() {
    return this.gameScene?.skinManager?.getSelectedDefinition?.() || CHARACTER_SKINS.skin_01;
  }

  refresh() {
    if (!this.root) return;
    const skin = this.getSelectedSkin();
    const portrait = skin?.portrait ? asset(skin.portrait) : '';
    if (portrait && portrait !== this.lastPortrait) {
      this.portraitImage.src = portrait;
      this.lastPortrait = portrait;
    }
    this.portraitButton.hidden = !portrait;
    if (!portrait) this.portraitFallback.hidden = false;
    this.activePanel?.refresh?.();
  }

  layout() {
    if (!this.root || !this.scene) return;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const barWidth = Math.min(220, width * 0.58);
    const barHeight = barWidth * 201 / 600;
    this.portraitButton.style.bottom = Math.max(0, barHeight + 12) + 'px';
  }

  isUiPointer(x, y) {
    if (this.activePanel) return true;
    if (!this.portraitButton || this.portraitButton.hidden || !this.scene) return false;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const barWidth = Math.min(220, width * 0.58);
    const barHeight = barWidth * 201 / 600;
    const centerY = height - barHeight - 6 - 54;
    return Math.abs(x - width / 2) <= 40 && Math.abs(y - centerY) <= 52;
  }

  openPanel(key) {
    this.closePanel();
    const shade = element('div', 'html-game-ui__shade');
    shade.addEventListener('pointerdown', event => {
      if (event.target === shade) this.closePanel();
      event.stopPropagation();
    });
    const skin = this.getSelectedSkin();
    const panel = new HtmlPanel(this, key, skin);
    this.activePanel = panel;
    shade.append(panel.node);
    this.root.append(shade);
    panel.refresh();
  }

  closePanel() {
    this.activePanel?.destroy();
    this.activePanel = null;
    this.root?.querySelector('.html-game-ui__shade')?.remove();
  }

  destroy() {
    this.closePanel();
    this.portraitButton?.remove();
    this.root?.remove();
    this.root = null;
    this.portraitButton = null;
    this.portraitImage = null;
    this.gameScene = null;
    this.scene = null;
  }
}

class HtmlPanel {
  constructor(owner, key, skin) {
    this.owner = owner;
    this.game = owner.gameScene;
    this.key = key;
    this.page = 0;
    this.node = element('section', 'html-game-ui__panel ' + (key === 'profile' ? 'html-game-ui__panel--vertical' : 'html-game-ui__panel--wide'));
    this.node.setAttribute('role', 'dialog');
    this.node.setAttribute('aria-modal', 'true');
    this.node.setAttribute('aria-label', key === 'profile' ? 'Perfil do personagem' : key === 'menu' ? 'Menu principal' : (INFO[key]?.[0] || 'Painel'));
    this.node.addEventListener('pointerdown', event => event.stopPropagation());
    this.art = element('img', 'html-game-ui__panel-art');
    this.art.src = key === 'profile' ? UI.vertical : UI.wide;
    this.art.alt = '';
    this.art.draggable = false;
    this.node.append(this.art);

    const close = element('button', 'html-game-ui__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fechar painel');
    const closeImg = element('img');
    closeImg.src = UI.close;
    closeImg.alt = '';
    close.append(closeImg);
    close.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); owner.closePanel(); });
    this.node.append(close);
    this.content = element('div', 'html-game-ui__panel-content');
    this.node.append(this.content);
    if (key === 'profile') this.buildProfile(skin);
    else if (key === 'menu') this.buildMenu();
    else this.buildInfo();
  }

  addText(parent, className, text) {
    const node = element('div', className, text);
    parent.append(node);
    return node;
  }

  buildMenu() {
    const entries = [['Bestiário','bestiary'],['Waifus','waifus'],['Inventário','inventory'],['Casa','house']];
    const grid = element('div', 'html-game-ui__menu-grid');
    for (const [label, key] of entries) {
      grid.append(imageButton(label, UI.button400, () => this.owner.openPanel(key)));
    }
    this.content.append(grid);
    const monitor = imageButton('FPS', UI.button200, () => {
      const target = this.owner.scene.scene.get('Game')?.performanceMonitor;
      target?.setEnabled(!Boolean(target?.enabled));
    }, 'html-game-ui__fps-button');
    this.content.append(monitor);
  }

  buildInfo() {
    const [title, status, description] = INFO[this.key] || INFO.bestiary;
    this.addText(this.content, 'html-game-ui__info-title', title);
    this.addText(this.content, 'html-game-ui__info-status', status);
    this.addText(this.content, 'html-game-ui__info-description', description);
  }

  buildProfile() {
    this.profilePortraitFrame = element('div', 'html-game-ui__profile-portrait-frame');
    this.profilePortraitFallback = element('span', 'html-game-ui__portrait-fallback');
    this.profilePortraitFallback.setAttribute('aria-hidden', 'true');
    this.portrait = element('img', 'html-game-ui__profile-portrait');
    this.portrait.alt = 'Retrato do personagem';
    this.portrait.draggable = false;
    this.portrait.addEventListener('load', () => { this.profilePortraitFallback.hidden = true; });
    this.portrait.addEventListener('error', () => { this.profilePortraitFallback.hidden = false; });
    this.profilePortraitFrame.append(this.profilePortraitFallback, this.portrait);
    this.content.append(this.profilePortraitFrame);
    this.profileImageFitter = new ProfileImageFitter(this.profilePortraitFrame, this.portrait);

    this.profileControls = element('div', 'html-game-ui__profile-controls');
    this.previousSkin = imageButton('‹', UI.button200, () => this.cycleSkin(-1), 'html-game-ui__profile-arrow');
    this.nextSkin = imageButton('›', UI.button200, () => this.cycleSkin(1), 'html-game-ui__profile-arrow');
    this.previousSkin.setAttribute('aria-label', 'Personagem anterior');
    this.nextSkin.setAttribute('aria-label', 'Próximo personagem');
    this.profileControls.append(this.previousSkin, this.nextSkin);
    this.content.append(this.profileControls);
    this.refreshProfileControls();
  }

  refreshProfileControls() {
    const available = this.game?.skinManager?.getCatalog?.().filter(entry => entry.selectable) || [];
    const hasMultiple = available.length > 1;
    if (this.previousSkin) this.previousSkin.disabled = !hasMultiple;
    if (this.nextSkin) this.nextSkin.disabled = !hasMultiple;
  }

  cycleSkin(direction) {
    const manager = this.game?.skinManager;
    if (!manager || ![-1, 1].includes(direction)) return false;
    const available = manager.getCatalog?.().filter(entry => entry.selectable) || [];
    if (available.length < 2) return false;
    const current = available.findIndex(entry => entry.selected);
    const start = current >= 0 ? current : 0;
    const next = (start + direction + available.length) % available.length;
    const result = manager.selectSkin(available[next].id);
    if (!result?.changed) return false;
    this.owner.refresh();
    this.refreshProfileControls();
    return true;
  }

  refresh() {
    if (!this.node?.isConnected && !this.node?.parentNode) return;
    if (this.key !== 'profile') return;
    const skin = this.owner.getSelectedSkin();
    const portrait = skin?.portrait ? asset(skin.portrait) : '';
    if (portrait && this.portrait.src !== new URL(portrait, document.baseURI).href) {
      this.profilePortraitFallback.hidden = false;
      this.portrait.src = portrait;
    }
    this.portrait.hidden = !portrait;
    this.profilePortraitFallback.hidden = Boolean(portrait && this.portrait.complete && this.portrait.naturalWidth > 0);
    this.refreshProfileControls();
  }

  destroy() {
    this.profileImageFitter?.destroy();
    this.profileImageFitter = null;
    this.node?.remove();
    this.node = null;
    this.owner = null;
    this.game = null;
  }
}
