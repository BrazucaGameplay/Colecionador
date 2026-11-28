import './html-game-ui.css';
import { STAT_UPGRADES } from '../entities/Player.js';
import { CHARACTER_SKINS } from '../rendering/characters/CharacterSkinCatalog.js';

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
    this.portraitImage = element('img');
    this.portraitImage.alt = 'Retrato do personagem';
    this.portraitImage.draggable = false;
    this.portraitButton.append(this.portraitImage);
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
    close.addEventListener('click', event => { event.stopPropagation(); owner.closePanel(); });
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
    this.portrait = element('img', 'html-game-ui__profile-portrait');
    this.portrait.alt = 'Personagem equipado';
    this.portrait.draggable = false;
    this.content.append(this.portrait);
    this.caption = this.addText(this.content, 'html-game-ui__profile-caption', 'PERSONAGEM');
    this.shortcut = imageButton('ESCOLHER SKIN', UI.button300, () => this.setPage(2), 'html-game-ui__skin-shortcut');
    this.content.append(this.shortcut);

    this.statsPage = element('div', 'html-game-ui__stats-page');
    this.summary = this.addText(this.statsPage, 'html-game-ui__profile-summary', '');
    this.rows = [];
    for (const [key, definition] of Object.entries(STAT_UPGRADES)) {
      const row = element('div', 'html-game-ui__stat-row');
      this.addText(row, 'html-game-ui__stat-label', definition.label);
      const value = this.addText(row, 'html-game-ui__stat-value', '');
      const plus = imageButton('+', UI.button200, () => this.allocate(key), 'html-game-ui__plus');
      row.append(plus);
      this.statsPage.append(row);
      this.rows.push({ key, value, plus });
    }
    this.addText(this.statsPage, 'html-game-ui__profile-footer', 'Use os pontos disponíveis para evoluir os atributos.');
    this.content.append(this.statsPage);

    this.skinsPage = element('div', 'html-game-ui__skins-page');
    this.addText(this.skinsPage, 'html-game-ui__skins-heading', 'APARÊNCIA DO PERSONAGEM');
    this.skinRows = element('div', 'html-game-ui__skin-rows');
    this.skinsPage.append(this.skinRows);
    this.content.append(this.skinsPage);

    const pager = element('div', 'html-game-ui__pager');
    this.previous = imageButton('‹', UI.button200, () => this.setPage(this.page - 1));
    this.indicator = this.addText(pager, 'html-game-ui__page-indicator', '1 / 3');
    this.next = imageButton('›', UI.button200, () => this.setPage(this.page + 1));
    pager.append(this.previous, this.next);
    this.content.append(pager);
    this.setPage(0);
  }

  setPage(page) {
    this.page = Math.max(0, Math.min(2, page));
    this.portrait.hidden = this.page !== 0;
    this.caption.hidden = this.page !== 0;
    this.shortcut.hidden = this.page !== 0;
    this.statsPage.hidden = this.page !== 1;
    this.skinsPage.hidden = this.page !== 2;
    this.indicator.textContent = (this.page + 1) + ' / 3';
    this.previous.disabled = this.page === 0;
    this.next.disabled = this.page === 2;
  }

  allocate(key) {
    if (!this.game?.player?.allocateStat(key)) return;
    this.game.persistProgress?.();
    this.refresh();
  }

  equipSkin(id) {
    const result = this.game?.skinManager?.selectSkin(id);
    this.owner.refresh();
    this.refresh();
    return Boolean(result?.changed);
  }

  refresh() {
    if (!this.node?.isConnected && !this.node?.parentNode) return;
    if (this.key !== 'profile') return;
    const player = this.game?.player;
    const skin = this.owner.getSelectedSkin();
    const portrait = skin?.portrait ? asset(skin.portrait) : '';
    if (portrait && this.portrait.src !== new URL(portrait, document.baseURI).href) this.portrait.src = portrait;
    if (!player) return;
    const required = this.game.progression?.getRequiredExperience(player.level) ?? 0;
    this.summary.textContent = 'Nível ' + player.level + '  •  EXP ' + player.experience + '/' + required + '  •  Pontos: ' + player.statPoints;
    for (const row of this.rows) {
      row.value.textContent = STAT_UPGRADES[row.key].format(player.stats[row.key]);
      row.plus.disabled = player.statPoints <= 0;
    }
    const catalog = this.game?.skinManager?.getCatalog?.() || [];
    if (this.skinRows.childElementCount !== catalog.length) {
      this.skinRows.replaceChildren();
      for (const entry of catalog) {
        const row = element('div', 'html-game-ui__skin-row');
        const image = element('img', 'html-game-ui__skin-thumb');
        image.alt = entry.name;
        image.src = asset(entry.portrait);
        const name = element('span', 'html-game-ui__skin-name', entry.name);
        const status = element('span', 'html-game-ui__skin-status', '');
        const button = imageButton('EQUIPAR', UI.button200, () => this.equipSkin(entry.id), 'html-game-ui__equip');
        row.append(image, name, status, button);
        this.skinRows.append(row);
      }
    }
    [...this.skinRows.children].forEach((row, index) => {
      const entry = catalog[index];
      if (!entry) return;
      row.querySelector('.html-game-ui__skin-status').textContent = entry.selected ? 'EQUIPADA' : entry.selectable ? 'DISPONÍVEL' : 'EM PREPARAÇÃO';
      const button = row.querySelector('button');
      button.querySelector('span').textContent = entry.selected ? 'EQUIPADA' : entry.selectable ? 'EQUIPAR' : 'INDISPONÍVEL';
      button.disabled = !entry.selectable || entry.selected;
    });
    this.setPage(this.page);
  }

  destroy() {
    this.node?.remove();
    this.node = null;
    this.owner = null;
    this.game = null;
  }
}
