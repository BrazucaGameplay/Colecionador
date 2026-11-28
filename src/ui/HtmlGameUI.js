import { CHARACTER_SKINS } from '../data/characters/CharacterSkinCatalog.js';
import ProfileImageFitter from './ProfileImageFitter.js';
import CardGallery from './cards/CardGallery.js';
import { STAT_UPGRADES } from '../entities/Player.js';

const BASE = import.meta.env?.BASE_URL ?? '/';
const asset = path => BASE + path;
import { WAIFU_CATALOG } from '../data/waifus/catalog.js';
const WAIFU_CARD_ASSETS = Object.freeze(Object.fromEntries(WAIFU_CATALOG.map(card => [card.id, card.cardAsset])));
const UI = Object.freeze({
  vertical: asset('assets/ui/panels/painel_vertical_900x1350_transparente.webp'),
  wide: asset('assets/ui/panels/perfil_moldura_fundo_vermelho.webp'),
  menuWide: asset('assets/ui/panels/menu_principal_moldura_completa.svg'),
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
    this.panelHistory = [];
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

  openPanel(key, { pushHistory = true } = {}) {
    const previousKey = this.activePanel?.key;
    if (pushHistory && previousKey && previousKey !== key) this.panelHistory.push(previousKey);
    this.closePanel({ clearHistory: false });
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

  goBackPanel() {
    const previousKey = this.panelHistory.pop();
    if (previousKey) {
      this.openPanel(previousKey, { pushHistory: false });
      return;
    }
    this.closePanel();
  }

  closePanel({ clearHistory = true } = {}) {
    this.activePanel?.destroy();
    this.activePanel = null;
    if (clearHistory) this.panelHistory.length = 0;
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
    this.node = element('section', 'html-game-ui__panel ' + (key === 'profile' ? 'html-game-ui__panel--vertical' : key === 'bestiary' ? 'html-game-ui__panel--bestiary' : key === 'waifus' ? 'html-game-ui__panel--bestiary html-game-ui__panel--waifus' : key === 'menu' ? 'html-game-ui__panel--wide html-game-ui__panel--menu' : 'html-game-ui__panel--wide'));
    this.node.setAttribute('role', 'dialog');
    this.node.setAttribute('aria-modal', 'true');
    this.node.setAttribute('aria-label', key === 'profile' ? 'Perfil do personagem' : key === 'menu' ? 'Menu principal' : (INFO[key]?.[0] || 'Painel'));
    this.node.addEventListener('pointerdown', event => event.stopPropagation());
    this.art = element('img', 'html-game-ui__panel-art');
    this.art.src = key === 'profile' || key === 'bestiary' || key === 'waifus' ? UI.vertical : key === 'menu' ? UI.menuWide : UI.wide;
    this.art.alt = '';
    this.art.draggable = false;
    this.node.append(this.art);

    this.closeButton = null;
    if (key !== 'profile') {
      this.closeButton = element('button', 'html-game-ui__close');
      this.closeButton.type = 'button';
      this.closeButton.setAttribute('aria-label', 'Fechar painel');
      const closeImg = element('img');
      closeImg.src = UI.close;
      closeImg.alt = '';
      this.closeButton.append(closeImg);
      this.closeButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        owner.closePanel();
      });
    }
    this.backButton = element('button', 'html-game-ui__panel-back', '‹');
    this.backButton.type = 'button';
    this.backButton.setAttribute('aria-label', 'Voltar');
    this.backButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      this.handleBack();
    });
    if (this.closeButton) this.node.append(this.closeButton);
    this.node.append(this.backButton);
    this.content = element('div', 'html-game-ui__panel-content');
    this.node.append(this.content);
    if (key === 'profile') this.buildProfile(skin);
    else if (key === 'menu') this.buildMenu();
    else this.buildInfo();
    this.updateBackButton();
    if (key === 'profile') this.bindProfileSwipe();
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
    const monitor = imageButton('FPS', null, () => {
      const target = this.owner.scene.scene.get('Game')?.performanceMonitor;
      const enabled = !Boolean(target?.enabled);
      target?.setEnabled(enabled);
      monitor.setAttribute('aria-pressed', String(enabled));
      monitor.querySelector('span').textContent = enabled ? 'FPS ON' : 'FPS';
    }, 'html-game-ui__fps-button');
    monitor.setAttribute('aria-pressed', 'false');
    this.content.append(monitor);
  }

  buildInfo() {
    if (this.key === 'waifus') {
      this.waifuGalleryHost = element('div', 'html-game-ui__waifu-gallery-host');
      this.waifuGrid = element('div', 'html-game-ui__waifu-grid');
      this.waifuGalleryHost.append(this.waifuGrid);
      this.content.append(this.waifuGalleryHost);
      this.renderWaifuCollection();
      return;
    }
    if (this.key === 'bestiary') {
      this.cardGalleryHost = element('div', 'html-game-ui__card-gallery-host');
      this.cardGalleryHost.id = 'bestiary-card-gallery';
      this.cardGallery = new CardGallery(this.cardGalleryHost);
      this.content.append(this.cardGalleryHost);
      return;
    }
    const [title, status, description] = INFO[this.key] || INFO.bestiary;
    this.addText(this.content, 'html-game-ui__info-title', title);
    this.addText(this.content, 'html-game-ui__info-status', status);
    this.addText(this.content, 'html-game-ui__info-description', description);
  }

  renderWaifuCollection() {
    if (!this.waifuGrid) return;
    const collection = Array.isArray(this.game?.waifuCollection) ? this.game.waifuCollection : [];
    const stacks = new Map();
    for (const acquisition of collection) {
      if (!acquisition || !WAIFU_CARD_ASSETS[acquisition.waifuId]) continue;
      // Uma pilha representa apenas cópias da mesma carta e da mesma qualidade.
      const key = JSON.stringify([acquisition.waifuId, acquisition.quality || 'D']);
      const stack = stacks.get(key) || {
        waifuId: acquisition.waifuId,
        name: acquisition.name || 'Waifu',
        quality: acquisition.quality || 'D',
        quantity: 0
      };
      stack.quantity += 1;
      stacks.set(key, stack);
    }
    const cards = [...stacks.values()];
    const signature = cards.map(item => `${item.waifuId}:${item.quality}:${item.quantity}:${item.name}`).join('|');
    if (signature === this.waifuCollectionSignature) return;
    this.waifuCollectionSignature = signature;
    this.waifuGrid.replaceChildren();
    if (!cards.length) {
      this.waifuGrid.append(element('p', 'html-game-ui__waifu-empty', 'Nenhuma carta obtida ainda.'));
      return;
    }
    for (const stack of cards) {
      const card = element('div', 'html-game-ui__waifu-tile');
      card.setAttribute('aria-label', `${stack.name}, qualidade ${stack.quality}, quantidade ${stack.quantity}`);
      const image = element('img', 'html-game-ui__waifu-image');
      image.src = asset(WAIFU_CARD_ASSETS[stack.waifuId]);
      image.alt = 'Carta original de ' + stack.name;
      image.draggable = false;
      image.addEventListener('error', () => {
        card.replaceChildren(element('span', 'html-game-ui__waifu-error', 'Falha ao carregar a carta.'));
      }, { once: true });
      card.append(image);
      if (stack.quantity > 1) {
        const count = element('span', 'html-game-ui__waifu-stack-count', String(stack.quantity));
        count.setAttribute('aria-label', `${stack.quantity} cartas nesta pilha`);
        card.append(count);
      }
      const caption = element('span', 'html-game-ui__waifu-name', stack.name);
      card.append(caption);
      this.waifuGrid.append(card);
    }
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

    this.swipeHints = element('div', 'html-game-ui__swipe-hints');
    this.swipeHints.setAttribute('aria-hidden', 'true');
    this.swipeHints.append(
      element('span', 'html-game-ui__swipe-arrow html-game-ui__swipe-arrow--left', '‹'),
      element('span', 'html-game-ui__swipe-arrow html-game-ui__swipe-arrow--right', '›')
    );
    this.content.append(this.swipeHints);
    this.profileImageFitter = new ProfileImageFitter(this.profilePortraitFrame, this.portrait);

    this.statsPage = element('div', 'html-game-ui__stats-page');
    this.summary = this.addText(this.statsPage, 'html-game-ui__profile-summary', '');
    this.statRows = [];
    for (const [key, definition] of Object.entries(STAT_UPGRADES)) {
      const row = element('div', 'html-game-ui__stat-row');
      this.addText(row, 'html-game-ui__stat-label', definition.label);
      const value = this.addText(row, 'html-game-ui__stat-value', '');
      const plus = imageButton('+', UI.button200, () => this.allocateStat(key), 'html-game-ui__plus');
      row.append(plus);
      this.statsPage.append(row);
      this.statRows.push({ key, value, plus });
    }
    this.statsFooter = this.addText(this.statsPage, 'html-game-ui__profile-footer', 'Use os pontos disponíveis para evoluir os atributos.');
    this.content.append(this.statsPage);

    this.waifuEquipPage = element('div', 'html-game-ui__waifu-equipment-page');
    this.waifuEquipTitle = this.addText(this.waifuEquipPage, 'html-game-ui__waifu-equipment-title', 'CARTAS EQUIPADAS');
    this.waifuEquipSlots = element('div', 'html-game-ui__waifu-equip-slots');
    this.waifuEquipList = element('div', 'html-game-ui__waifu-equip-list');
    this.waifuEquipPage.append(this.waifuEquipSlots, this.waifuEquipList);
    this.content.append(this.waifuEquipPage);
    this.buildWaifuEquipmentPage();

    this.setPage(this.page);
    this.refreshProfileData();
  }

  buildWaifuEquipmentPage() {
    const equipment = this.game?.waifuEquipment;
    const equipped = equipment?.getEquippedSlots?.() || equipment?.getEquipped?.() || [];
    this.waifuEquipSlots.replaceChildren();
    for (let index = 0; index < 3; index++) {
      const card = equipped[index];
      const slot = element('div', 'html-game-ui__waifu-equip-slot');
      const details = element('div', 'html-game-ui__waifu-equip-slot-details');
      const label = element('span', 'html-game-ui__waifu-equip-slot-label', 'CARTA ' + (index + 1));
      const definition = WAIFU_CATALOG.find(item => item.id === card?.waifuId);
      const value = element('span', 'html-game-ui__waifu-equip-slot-value', card?.name || 'Vazio');
      details.append(label, value);
      if (card) {
        const ability = definition?.activeAbility;
        if (ability) details.append(element('span', 'html-game-ui__waifu-equip-description', ability.name + ' · automática'));
      }
      slot.append(details);
      if (card) {
        const remove = imageButton('REMOVER', UI.button200, () => this.unequipWaifu(index), 'html-game-ui__waifu-equip-equip');
        slot.append(remove);
      }
      this.waifuEquipSlots.append(slot);
    }
    this.waifuEquipList.replaceChildren();
    const collection = equipment?.getCollection?.() || [];
    const available = collection.filter(card => !equipped.some(item => item.instanceId === card.instanceId));
    if (!available.length) {
      this.addText(this.waifuEquipList, 'html-game-ui__waifu-equipment-empty',
        collection.length ? 'Todas as cartas disponíveis já estão equipadas.' : 'Obtenha cartas derrotando monstros para liberar habilidades.');
      return;
    }
    const availableStacks = new Map();
    for (const card of available) {
      const key = JSON.stringify([card.waifuId, card.quality || 'D']);
      const stack = availableStacks.get(key) || { card, quantity: 0 };
      stack.quantity += 1;
      availableStacks.set(key, stack);
    }
    for (const { card, quantity } of availableStacks.values()) {
      const definition = WAIFU_CATALOG.find(item => item.id === card.waifuId);
      const row = element('div', 'html-game-ui__waifu-equip-row');
      const details = element('div', 'html-game-ui__waifu-equip-details');
      const name = (card.name || definition?.name || 'Waifu') + (quantity > 1 ? ' ×' + quantity : '');
      this.addText(details, 'html-game-ui__waifu-equip-name', name);
      this.addText(details, 'html-game-ui__waifu-equip-description',
        definition?.activeAbility ? definition.activeAbility.name + ' · recarga ' + (definition.activeAbility.cooldownMs / 1000) + 's' : 'Sem habilidade ativa cadastrada');
      const button = imageButton('EQUIPAR', UI.button200,
        () => this.equipWaifu(card.instanceId), 'html-game-ui__waifu-equip-equip');
      button.disabled = equipped.length >= 3 || !definition;
      row.append(details, button);
      this.waifuEquipList.append(row);
    }
  }

  equipWaifu(instanceId) {
    const result = this.game?.waifuEquipment?.equip?.(instanceId);
    if (!result?.changed) return false;
    this.game?.persistProgress?.();
    this.buildWaifuEquipmentPage();
    return true;
  }

  unequipWaifu(slot) {
    const result = this.game?.waifuEquipment?.unequip?.(slot);
    if (!result?.changed) return false;
    this.game?.persistProgress?.();
    this.buildWaifuEquipmentPage();
    return true;
  }

  allocateStat(key) {
    if (!this.game?.player?.allocateStat(key)) return false;
    this.game.persistProgress?.();
    this.refreshProfileData();
    return true;
  }

  handleBack() {
    if (this.key === 'bestiary') {
      if (this.cardGallery?.backToGallery()) {
        this.updateBackButton();
        return;
      }
      const next = this.cardGallery?.category === 'monsters' ? 'bosses' : 'monsters';
      this.cardGallery?.setCategory(next);
      this.updateBackButton();
      return;
    }
    if (this.key === 'profile' && this.page > 0) {
      this.setPage(this.page - 1, 'backward');
      return;
    }
    this.owner.goBackPanel();
  }

  updateBackButton() {
    if (!this.backButton) return;
    let label = 'Voltar';
    let direction = '‹';
    if (this.key === 'bestiary') {
      if (this.cardGallery?.page === 'detail' || this.cardGallery?.category === 'bosses') {
        label = this.cardGallery.page === 'detail' ? 'Voltar à galeria' : 'Voltar aos monstros';
      } else {
        label = 'Mostrar Boss';
        direction = '›';
      }
    } else if (this.key === 'profile' && this.page === 0) {
      label = 'Voltar ao menu';
    } else if (this.key === 'profile') {
      label = 'Voltar à página anterior';
    } else if (this.key === 'menu') {
      label = 'Voltar ao jogo';
    } else {
      label = 'Voltar ao menu';
    }
    this.backButton.textContent = direction;
    this.backButton.setAttribute('aria-label', label);
  }

  bindProfileSwipe() {
    let start = null;
    this.content.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || event.target?.tagName === 'BUTTON') return;
      start = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      if (event.target?.setPointerCapture && event.pointerId !== undefined) {
        try { event.target.setPointerCapture(event.pointerId); } catch { /* captura não suportada pelo navegador */ }
      }
    });
    this.content.addEventListener('pointerup', event => {
      if (!start || event.pointerType !== 'touch' || (start.pointerId !== undefined && event.pointerId !== start.pointerId)) return;
      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      start = null;
      if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
      const direction = deltaX < 0 ? 'forward' : 'backward';
      this.setPage(this.page + (direction === 'forward' ? 1 : -1), direction);
    });
    this.content.addEventListener('pointercancel', () => { start = null; });
  }

  setPage(page, direction = 'forward') {
    const previous = this.page;
    this.page = Math.max(0, Math.min(2, page));
    this.profilePortraitFrame.hidden = this.page !== 0;
    this.statsPage.hidden = this.page !== 1;
    this.waifuEquipPage.hidden = this.page !== 2;
    const active = this.page === 0 ? this.profilePortraitFrame : this.page === 1 ? this.statsPage : this.waifuEquipPage;
    if (previous !== this.page && active) {
      active.className = active.className
        .replace(/\s+is-entering-from-(?:left|right)/g, '')
        + (direction === 'forward' ? ' is-entering-from-right' : ' is-entering-from-left');
    }
    this.updateBackButton();
    if (this.page === 1) this.refreshProfileData();
    if (this.page === 2) this.buildWaifuEquipmentPage();
  }

  refreshProfileData() {
    const player = this.game?.player;
    if (!player || !this.summary) return;
    const required = this.game.progression?.getRequiredExperience(player.level) ?? 0;
    this.summary.textContent = 'Nível ' + player.level + ' • EXP ' + player.experience + '/' + required + ' • Pontos: ' + player.statPoints;
    for (const row of this.statRows) {
      row.value.textContent = STAT_UPGRADES[row.key].format(player.stats[row.key]);
      row.plus.disabled = player.statPoints <= 0;
    }
  }

  refresh() {
    if (!this.node?.isConnected && !this.node?.parentNode) return;
    if (this.key === 'waifus') {
      this.renderWaifuCollection();
      this.updateBackButton();
      return;
    }
    if (this.key !== 'profile') return;
    const skin = this.owner.getSelectedSkin();
    const portrait = skin?.portrait ? asset(skin.portrait) : '';
    if (portrait && this.portrait.src !== new URL(portrait, document.baseURI).href) {
      this.profilePortraitFallback.hidden = false;
      this.portrait.src = portrait;
    }
    this.portrait.hidden = !portrait;
    this.profilePortraitFallback.hidden = Boolean(portrait && this.portrait.complete && this.portrait.naturalWidth > 0);
    this.refreshProfileData();
    if (this.page === 2) this.buildWaifuEquipmentPage();
    this.updateBackButton();
  }

  destroy() {
    this.profileImageFitter?.destroy();
    this.profileImageFitter = null;
    this.cardGallery?.destroy();
    this.cardGallery = null;
    if (this.statRows) this.statRows.length = 0;
    this.node?.remove();
    this.node = null;
    this.owner = null;
    this.game = null;
  }
}
