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
