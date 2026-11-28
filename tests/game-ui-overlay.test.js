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
    assert.match(ui.activePanel.node.textContent + ui.activePanel.content.children.map(n => n.textContent).join(' '), /BESTIÁRIO/);
    assert.ok(ui.activePanel.node.className.includes('html-game-ui__panel--bestiary'));
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__panel-art').src.endsWith('/assets/ui/panels/painel_vertical_900x1350_transparente.webp'));

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
    findByClass(ui.activePanel.node, 'html-game-ui__card-navigation').click();
    assert.ok(findByClass(ui.activePanel.node, 'html-game-ui__card-grid'), 'o retorno deve restaurar a grade no mesmo painel');

    const shade = dom.root.querySelector('.html-game-ui__shade');
    shade.dispatch('pointerdown', { target: shade });
    assert.equal(ui.activePanel, null);
    assert.equal(ui.isUiPointer(20, 20), false);

    ui.openPanel('inventory');
    findByClass(ui.activePanel.node, 'html-game-ui__close').click();
    assert.equal(ui.activePanel, null);
    ui.destroy();
  } finally {
    dom.restore();
  }
});
