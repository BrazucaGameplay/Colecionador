import test from 'node:test';
import assert from 'node:assert/strict';
import HtmlGameUI from '../src/ui/HtmlGameUI.js';
import { installFakeDom, findByClass } from './helpers/fake-dom.js';

test('retrato HUD é clicável, atualiza fallback e bloqueia apenas sua região', () => {
  const dom = installFakeDom();
  try {
    let opened = 0;
    const game = {
      skinManager: { getSelectedDefinition: () => ({
        portrait: 'assets/characters/sprites/skin_01/perfil.png'
      }) }
    };
    const scene = { scale: { width: 960, height: 540 }, scene: { get: () => game } };
    const ui = new HtmlGameUI(scene, { openProfile: () => opened++ });

    assert.equal(ui.portraitButton.hidden, false);
    assert.ok(ui.portraitImage.src.endsWith('/assets/characters/sprites/skin_01/perfil.png'));
    ui.portraitImage.dispatch('error');
    assert.equal(ui.portraitFallback.hidden, false);
    ui.portraitImage.dispatch('load');
    assert.equal(ui.portraitFallback.hidden, true);

    assert.equal(ui.isUiPointer(480, 406), true);
    assert.equal(ui.isUiPointer(100, 100), false);
    ui.portraitButton.click();
    assert.equal(opened, 1);
    ui.destroy();
    assert.equal(dom.root.children.length, 0);
  } finally {
    dom.restore();
  }
});

test('menu abre painéis informativos e o toque fora ou o X fecha o overlay', () => {
  const dom = installFakeDom();
  try {
    const game = { skinManager: { getSelectedDefinition: () => ({ portrait: '' }) } };
    const scene = { scale: { width: 960, height: 540 }, scene: { get: () => game } };
    const ui = new HtmlGameUI(scene);

    ui.openPanel('menu');
    assert.equal(ui.isUiPointer(20, 20), true);
    const menu = findByClass(ui.activePanel.node, 'html-game-ui__menu-grid');
    assert.ok(menu);
    menu.children[0].click();
    assert.equal(ui.activePanel.key, 'bestiary');
    assert.equal(findByClass(ui.activePanel.node, 'html-game-ui__info-title'), null, 'o título BESTIÁRIO não deve aparecer');
    assert.equal(findByClass(ui.activePanel.node, 'html-game-ui__card-tabs'), null, 'as caixas de categoria superiores devem ser removidas');
    assert.ok(ui.activePanel.node.className.includes('html-game-ui__panel--bestiary'));
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__panel-art').src.endsWith('/assets/ui/panels/painel_vertical_900x1350_transparente.webp'));

    const globalBack = findByClass(ui.activePanel.node, 'html-game-ui__panel-back');
    const globalClose = findByClass(ui.activePanel.node, 'html-game-ui__close');
    assert.ok(globalBack, 'o botão global deve ficar no rodapé do painel');
    assert.ok(globalClose, 'o X global deve ficar no canto superior direito');
    assert.equal(findByClass(ui.activePanel.node, 'html-game-ui__card-category-arrow'), null);
    assert.equal(findByClass(ui.activePanel.node, 'html-game-ui__profile-controls'), null);
    assert.equal(ui.activePanel.cardGallery.container.className, 'html-game-ui__card-gallery-host', 'o host de posicionamento não pode perder sua classe');
    assert.ok(findByClass(ui.activePanel.cardGallery.container, 'html-game-ui__card-gallery'), 'a galeria deve ser filha do host posicionado');
    assert.equal(globalBack.textContent, '›');
    globalBack.click();
    assert.equal(ui.activePanel.cardGallery.category, 'bosses');
    assert.equal(globalBack.textContent, '‹');
    assert.equal(globalBack.getAttribute('aria-label'), 'Voltar aos monstros');
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__card-empty'), 'Boss sem cadastro deve exibir estado vazio no painel');
    globalBack.click();
    assert.equal(ui.activePanel.cardGallery.category, 'monsters');
    assert.equal(globalBack.textContent, '›');

    const cardTile = findByClass(ui.activePanel.node, 'html-game-ui__card-tile');
    assert.ok(cardTile, 'a carta registrada deve aparecer na grade');
    cardTile.click();
    const flipCard = findByClass(ui.activePanel.node, 'html-game-ui__card-flip');
    assert.ok(flipCard, 'clicar na carta deve abrir a mesma carta com frente e verso');
    assert.equal(flipCard.getAttribute('aria-pressed'), 'false');
    flipCard.click();
    assert.ok(flipCard.className.includes('is-flipped'), 'a carta deve girar para mostrar o verso');
    assert.equal(flipCard.getAttribute('aria-pressed'), 'true');
    assert.ok(findByClass(flipCard, 'html-game-ui__card-stats'), 'o verso deve exibir os status reais');
    assert.equal(findByClass(ui.activePanel.node, 'html-game-ui__card-navigation'), null, 'o botão interno antigo deve ser removido');
    globalBack.click();
    assert.equal(ui.activePanel.cardGallery.page, 'gallery');
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__card-grid'), 'o botão global deve restaurar a grade no mesmo painel');

    const shade = dom.root.querySelector('.html-game-ui__shade');
    shade.dispatch('pointerdown', { target: shade });
    assert.equal(ui.activePanel, null);
    assert.equal(ui.isUiPointer(20, 20), false);

    ui.openPanel('menu');
    findByClass(ui.activePanel.node, 'html-game-ui__panel-back').click();
    assert.equal(ui.activePanel, null, 'o botão global deve voltar do menu ao jogo');

    ui.openPanel('inventory');
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__panel-back'));
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__close'));
    findByClass(ui.activePanel.node, 'html-game-ui__close').click();
    assert.equal(ui.activePanel, null);
    ui.destroy();
  } finally {
    dom.restore();
  }
});
