import test from 'node:test';
import assert from 'node:assert/strict';
import Player from '../src/entities/Player.js';
import HtmlGameUI from '../src/ui/HtmlGameUI.js';
import { calculateContainLayout } from '../src/ui/ProfileImageFitter.js';
import { installFakeDom, findByClass, findAllByClass } from './helpers/fake-dom.js';

test('encaixe preserva a proporção e mantém o conteúdo alfa dentro do frame', () => {
  const layout = calculateContainLayout(
    2288, 1249,
    { left: 180, top: 80, right: 2200, bottom: 1180 },
    280, 360
  );
  assert.ok(layout.width > 0 && layout.height > 0);
  const scaleX = layout.width / 2288;
  const scaleY = layout.height / 1249;
  assert.ok(Math.abs(scaleX - scaleY) < 1e-9);
  assert.ok(layout.left + 180 * scaleX >= 0);
  assert.ok(layout.top + 80 * scaleY >= 0);
  assert.ok(layout.left + 2200 * scaleX <= 280);
  assert.ok(layout.top + 1180 * scaleY <= 360);
});

test('perfil percorre Personagem, Status e Skills e executa ações reais do Player', () => {
  const dom = installFakeDom();
  try {
    const player = new Player({ saveData: { statPoints: 1 } });
    let saves = 0;
    let equipped = false;
    const game = {
      player,
      progression: { getRequiredExperience: level => 100 * level },
      persistProgress() { saves++; },
      skinManager: { getSelectedDefinition: () => ({
        id: 'skin_01',
        portrait: 'assets/characters/sprites/skin_01/perfil.png'
      }) },
      skillManager: {
        getEquippedSkills: () => equipped ? [{ id: 'fire', name: 'Fogo' }] : [],
        getCatalog: () => [{ id: 'fire', name: 'Fogo', description: 'Projétil de fogo', unlocked: true, equipped }],
        equip(id) { if (id !== 'fire' || equipped) return { changed: false }; equipped = true; return { changed: true }; }
      }
    };
    const scene = {
      scale: { width: 960, height: 540 },
      scene: { get: name => name === 'Game' ? game : null }
    };
    const ui = new HtmlGameUI(scene);
    ui.openPanel('profile');
    const panel = ui.activePanel;

    assert.equal(panel.page, 0);
    assert.equal(panel.profilePortraitFrame.hidden, false);
    assert.equal(panel.statsPage.hidden, true);
    assert.equal(panel.skillsPage.hidden, true);
    assert.ok(panel.portrait.src.endsWith('/assets/characters/sprites/skin_01/perfil.png'));

    panel.portrait.naturalWidth = 2288;
    panel.portrait.naturalHeight = 1249;
    panel.portrait.complete = true;
    panel.portrait.dispatch('load');
    assert.equal(panel.profilePortraitFallback.hidden, true);
    assert.ok(panel.portrait.style.width.endsWith('px'));

    panel.content.dispatch('pointerdown', { pointerType: 'touch', clientX: 320, clientY: 220 });
    panel.content.dispatch('pointerup', { pointerType: 'touch', clientX: 220, clientY: 220 });
    assert.equal(panel.page, 1);
    assert.equal(panel.profilePortraitFrame.hidden, true);
    assert.equal(panel.statsPage.hidden, false);
    const attackPlus = findAllByClass(panel.statsPage, 'html-game-ui__plus')[0];
    assert.ok(attackPlus);
    attackPlus.click();
    assert.equal(player.stats.attack, 6);
    assert.equal(player.statPoints, 0);
    assert.equal(saves, 1);

    panel.content.dispatch('pointerdown', { pointerType: 'touch', clientX: 320, clientY: 220 });
    panel.content.dispatch('pointerup', { pointerType: 'touch', clientX: 220, clientY: 220 });
    assert.equal(panel.page, 2);
    assert.equal(panel.skillsPage.hidden, false);
    assert.equal(panel.skillSlots.children.length, 3);
    const equip = findByClass(panel.skillList, 'html-game-ui__skill-equip');
    assert.ok(equip);
    equip.click();
    assert.equal(equipped, true);
    assert.match(panel.skillSlots.children[0].children[1].textContent, /Fogo/);
    findByClass(panel.node, 'html-game-ui__panel-back').click();
    assert.equal(panel.page, 1, 'o botão global retorna à página anterior');

    findByClass(panel.node, 'html-game-ui__close').click();
    assert.equal(ui.activePanel, null);
    assert.equal(dom.root.querySelector('.html-game-ui__shade'), null);
    ui.destroy();
    assert.equal(dom.root.children.length, 0);
  } finally {
    dom.restore();
  }
});
