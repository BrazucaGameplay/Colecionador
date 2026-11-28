import { getBestiaryCatalog } from '../../data/bestiary/index.js';

const BASE = import.meta.env?.BASE_URL ?? '/';
const asset = path => BASE + path;
const STAT_LABELS = Object.freeze({
  attack: 'Ataque', defense: 'Defesa', penetration: 'Penetração',
  attackSpeed: 'Velocidade de ataque', movementSpeed: 'Velocidade de movimento',
  maxHealth: 'Vida máxima', maxEnergy: 'Energia máxima',
  healthRegen: 'Regeneração de vida', energyRegen: 'Regeneração de energia'
});

function node(tag, className, text) {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (text !== undefined) value.textContent = text;
  return value;
}
function button(label, className, onClick) {
  const value = node('button', className, label);
  value.type = 'button';
  value.setAttribute('aria-label', label);
  value.addEventListener('click', onClick);
  return value;
}

/** Galeria reutilizável: só definições registradas podem aparecer. */
export default class CardGallery {
  constructor(container, { catalog = getBestiaryCatalog() } = {}) {
    this.container = container;
    this.catalog = catalog;
    this.category = 'monsters';
    this.selected = null;
    this.flipped = false;
    this.page = 'gallery';
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.replaceChildren();
    this.container.className = 'html-game-ui__card-gallery';
    const tabs = node('div', 'html-game-ui__card-tabs');
    tabs.append(
      button('MONSTROS', 'html-game-ui__card-tab' + (this.category === 'monsters' ? ' is-active' : ''), () => this.setCategory('monsters')),
      button('BOSS', 'html-game-ui__card-tab' + (this.category === 'bosses' ? ' is-active' : ''), () => this.setCategory('bosses'))
    );
    this.container.append(tabs);
    if (this.page === 'gallery') this.renderGrid();
    else this.renderDetail();
  }

  setCategory(category) {
    this.category = category;
    this.selected = null;
    this.flipped = false;
    this.page = 'gallery';
    this.render();
  }

  renderGrid() {
    const entries = this.catalog[this.category] || [];
    const grid = node('div', 'html-game-ui__card-grid');
    const visible = entries.filter(entry => entry.cardAsset);
    if (!visible.length) grid.append(node('p', 'html-game-ui__card-empty',
      this.category === 'bosses' ? 'Nenhum Boss cadastrado.' : 'Nenhum monstro cadastrado.'));
    for (const entry of visible) {
      const card = button(entry.name, 'html-game-ui__card-tile', () => {
        this.selected = entry;
        this.flipped = false;
        this.page = 'detail';
        this.render();
      });
      const image = node('img', 'html-game-ui__card-image');
      image.src = asset(entry.cardAsset);
      image.alt = 'Carta de ' + entry.name;
      image.draggable = false;
      image.addEventListener('error', () => {
        card.className += ' has-error';
        image.remove();
        card.append(node('span', 'html-game-ui__card-error', 'Falha ao carregar a carta'));
      }, { once: true });
      card.append(image, node('span', 'html-game-ui__card-name', entry.name));
      grid.append(card);
    }
    this.container.append(grid);
  }

  renderDetail() {
    const entry = this.selected;
    if (!entry) {
      this.page = 'gallery';
      this.render();
      return;
    }

    const detail = node('div', 'html-game-ui__card-detail');
    const flip = button('Virar carta de ' + entry.name,
      'html-game-ui__card-flip' + (this.flipped ? ' is-flipped' : ''), () => {
        this.flipped = !this.flipped;
        flip.className = 'html-game-ui__card-flip' + (this.flipped ? ' is-flipped' : '');
        flip.setAttribute('aria-pressed', String(this.flipped));
        flip.setAttribute('aria-label', this.flipped
          ? 'Mostrar frente da carta de ' + entry.name
          : 'Mostrar status no verso da carta de ' + entry.name);
      });
    flip.setAttribute('aria-pressed', 'false');

    const inner = node('span', 'html-game-ui__card-flip-inner');
    const front = node('span', 'html-game-ui__card-face html-game-ui__card-face--front');
    const image = node('img', 'html-game-ui__card-expanded');
    image.src = asset(entry.cardAsset);
    image.alt = 'Carta original de ' + entry.name;
    image.draggable = false;
    image.addEventListener('error', () => {
      front.append(node('span', 'html-game-ui__card-error', 'Não foi possível carregar a carta original.'));
      image.remove();
    }, { once: true });
    front.append(image);

    const back = node('span', 'html-game-ui__card-face html-game-ui__card-face--back');
    back.append(node('span', 'html-game-ui__card-detail-title', entry.name));
    back.append(node('span', 'html-game-ui__card-back-subtitle', 'STATUS'));
    const stats = entry.definition?.stats;
    const list = node('dl', 'html-game-ui__card-stats');
    for (const [key, label] of Object.entries(STAT_LABELS)) {
      if (!stats || !Number.isFinite(stats[key])) continue;
      list.append(node('dt', '', label), node('dd', '', String(stats[key])));
    }
    if (!list.children.length) list.append(node('dt', 'html-game-ui__card-no-stats', 'Status ainda não cadastrado'));
    back.append(list);
    inner.append(front, back);
    flip.append(inner);

    const backButton = button('‹ Voltar ao bestiário', 'html-game-ui__card-navigation', () => {
      this.selected = null;
      this.flipped = false;
      this.page = 'gallery';
      this.render();
    });
    detail.append(flip, backButton);
    this.container.append(detail);
  }

  destroy() {
    this.container?.replaceChildren();
    this.container = null;
    this.catalog = null;
    this.selected = null;
  }
}
