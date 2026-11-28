import test from 'node:test';
import assert from 'node:assert/strict';
import Player from '../src/entities/Player.js';
import HtmlGameUI from '../src/ui/HtmlGameUI.js';
import { calculateContainLayout } from '../src/ui/ProfileImageFitter.js';
import { installFakeDom, findByClass, findAllByClass } from './helpers/fake-dom.js';
import WaifuEquipmentManager from '../src/systems/waifus/WaifuEquipmentManager.js';

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

test('perfil percorre Personagem, Status e Cartas Equipadas e executa ações reais do Player', () => {
  const dom = installFakeDom();
  try {
    const player = new Player({ saveData: { statPoints: 1 } });
    let saves = 0;
    const ownedCard = { instanceId: 'owned-slime-1', waifuId: 'slime-maiden', name: 'Donzela Slime', quality: 'D' };
    const equipment = new WaifuEquipmentManager({ collection: [ownedCard] });
    const game = {
      player,
      progression: { getRequiredExperience: level => 100 * level },
      persistProgress() { saves++; },
      skinManager: { getSelectedDefinition: () => ({
        id: 'skin_01',
        portrait: 'assets/characters/sprites/skin_01/perfil.png'
      }) },
      waifuEquipment: equipment
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
    assert.equal(panel.waifuEquipPage.hidden, true);
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
    assert.equal(panel.waifuEquipPage.hidden, false);
    assert.equal(panel.waifuEquipSlots.children.length, 3);
    const equip = findByClass(panel.waifuEquipList, 'html-game-ui__waifu-equip-equip');
    assert.ok(equip);
    equip.click();
    assert.equal(equipment.getEquipped()[0].waifuId, 'slime-maiden');
    assert.match(findByClass(panel.waifuEquipSlots.children[0], 'html-game-ui__waifu-equip-slot-value').textContent, /Donzela Slime/);
    findByClass(panel.node, 'html-game-ui__panel-back').click();
    assert.equal(panel.page, 1, 'o botão Voltar retorna à página anterior');
    panel.content.dispatch('pointerdown', { pointerType: 'touch', clientX: 220, clientY: 220 });
    panel.content.dispatch('pointerup', { pointerType: 'touch', clientX: 320, clientY: 220 });
    assert.equal(panel.page, 0, 'arrastar para a direita retorna de Status a Personagem');
    assert.equal(findByClass(panel.node, 'html-game-ui__close'), null, 'o Perfil não deve exibir botão X/Sair');
    findByClass(panel.node, 'html-game-ui__panel-back').click();
    assert.equal(ui.activePanel, null, 'Voltar na primeira tela retorna ao jogo');
    assert.equal(dom.root.querySelector('.html-game-ui__shade'), null);
    ui.destroy();
    assert.equal(dom.root.children.length, 0);
  } finally {
    dom.restore();
  }
});


test('painel Waifus exibe apenas cartas adquiridas sem moldura individual', () => {
  const dom = installFakeDom();
  try {
    const game = {
      waifuCollection: [{
        waifuId: 'slime-maiden',
        name: 'Donzela Slime',
        quality: 'D',
        level: 1
      }]
    };
    const scene = {
      scale: { width: 960, height: 540 },
      scene: { get: name => name === 'Game' ? game : null }
    };
    const ui = new HtmlGameUI(scene);
    ui.openPanel('waifus');
    const panel = ui.activePanel;
    const image = findByClass(panel.waifuGrid, 'html-game-ui__waifu-image');
    assert.ok(image);
    assert.ok(image.src.endsWith('/assets/cards/waifus/carta.slime.webp'));
    assert.equal(findByClass(panel.waifuGrid, 'html-game-ui__waifu-name').textContent, 'Donzela Slime');
    assert.equal(findByClass(panel.waifuGrid, 'html-game-ui__waifu-empty'), null);
    assert.match(panel.node.className, /html-game-ui__panel--bestiary/);
    assert.match(panel.node.className, /html-game-ui__panel--waifus/);
    ui.destroy();
    assert.equal(dom.root.children.length, 0);
  } finally {
    dom.restore();
  }
});


test('coleção de waifus agrupa apenas cartas idênticas por personagem e qualidade', () => {
  const dom = installFakeDom();
  try {
    const game = {
      waifuCollection: [
        { waifuId: 'slime-maiden', name: 'Donzela Slime', quality: 'D', level: 1 },
        { waifuId: 'slime-maiden', name: 'Donzela Slime', quality: 'D', level: 1 },
        { waifuId: 'slime-maiden', name: 'Donzela Slime', quality: 'A', level: 1 }
      ]
    };
    const scene = {
      scale: { width: 960, height: 540 },
      scene: { get: name => name === 'Game' ? game : null }
    };
    const ui = new HtmlGameUI(scene);
    ui.openPanel('waifus');
    const panel = ui.activePanel;
    const tiles = panel.waifuGrid.children.filter(node => node.className.includes('html-game-ui__waifu-tile'));
    assert.equal(tiles.length, 2, 'qualidades diferentes continuam em pilhas separadas');
    const stacked = findByClass(tiles[0], 'html-game-ui__waifu-stack-count');
    assert.ok(stacked);
    assert.equal(stacked.textContent, '2');
    assert.equal(findByClass(tiles[1], 'html-game-ui__waifu-stack-count'), null, 'carta única não mostra contador');
    assert.ok(findByClass(tiles[0], 'html-game-ui__waifu-image'), 'a arte original permanece sem moldura');
    assert.match(tiles[0].getAttribute('aria-label'), /quantidade 2/);
    ui.destroy();
    assert.equal(dom.root.children.length, 0);
  } finally {
    dom.restore();
  }
});
