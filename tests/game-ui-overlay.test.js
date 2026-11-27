// UI architecture tests: panel cleanup may be inherited from InfoPanel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('a inicialização não depende mais da cena Menu', async () => {
  const [main, preload, oldMenu] = await Promise.all([
    read('../src/main.js'), read('../src/scenes/Preload.js'),
    read('../src/scenes/Menu.js').catch(() => '')
  ]);
  assert.doesNotMatch(main, /scenes\/Menu\.js|\bMenu\b/);
  assert.match(main, /scene: \[Boot, Preload, Game, GameUI\]/);
  assert.match(preload, /scene\.start\('Game'\)/);
  assert.equal(oldMenu, '');
});

test('GameUI coordena painéis separados e mantém a simulação ativa', async () => {
  const [game, ui] = await Promise.all([read('../src/scenes/Game.js'), read('../src/scenes/GameUI.js')]);
  assert.match(game, /scene\.launch\('GameUI'\)/);
  assert.doesNotMatch(game, /scene\.(pause|sleep)\(/);
  for (const name of ['PlayerHUD', 'MenuPanel', 'ProfilePanel', 'BestiaryPanel', 'WaifuPanel', 'InventoryPanel', 'HousePanel']) {
    assert.ok(ui.includes(name));
  }
  assert.match(ui, /this\.hud\.setPlayer/);
});

test('toques na HUD e nos painéis não são enviados ao movimento do mundo', async () => {
  const [bootstrap, ui, hud] = await Promise.all([
    read('../src/systems/GameSystemsBootstrap.js'),
    read('../src/scenes/GameUI.js'),
    read('../src/ui/HUD/PlayerHUD.js')
  ]);
  assert.match(bootstrap, /scene\.uiScene\?\.isUiPointer\(x, y\)/);
  assert.match(ui, /isUiPointer\(x, y\)/);
  assert.match(ui, /Boolean\(this\.activePanel\)/);
  assert.match(hud, /containsScreenPoint/);
});

test('HUD e painéis não dependem das imagens antigas', async () => {
  const paths = [
    '../src/scenes/GameUI.js', '../src/ui/HUD/PlayerHUD.js',
    '../src/ui/HUD/StatusBars.js', '../src/ui/components/MenuButton.js',
    '../src/ui/components/PanelFrame.js'
  ];
  const sources = await Promise.all(paths.map(read));
  const source = sources.join('\n');
  assert.doesNotMatch(source, /ui-panel-frame|ui-menu-button|player-portrait|assets\/ui\//);
  assert.match(sources[2], /setValues/);
  assert.match(sources[3], /pointerdown/);
  assert.match(sources[4], /MenuButton/);
});

test('todos os painéis usam a moldura compartilhada e liberam seus objetos', async () => {
  const names = ['MenuPanel', 'ProfilePanel', 'BestiaryPanel', 'WaifuPanel', 'InventoryPanel', 'HousePanel'];
  const sources = await Promise.all(names.map(name => read('../src/ui/panels/' + name + '.js')));
  for (const source of sources) assert.match(source, /PanelFrame|InfoPanel/);
  const shared = await read('../src/ui/panels/InfoPanel.js');
  assert.match(shared, /destroy\(\)/);
  assert.match(await read('../src/ui/components/PanelFrame.js'), /destroy\(\)/);
});

test('as pastas de arte estão documentadas e separadas por função', async () => {
  const docs = await Promise.all([
    read('../public/assets/ui/panels/README.md'),
    read('../public/assets/ui/buttons/README.md'),
    read('../public/assets/ui/hud/README.md')
  ]);
  assert.match(docs[0], /panel-frame\.webp/);
  assert.match(docs[1], /button-primary\.webp/);
  assert.match(docs[2], /hp-bar-frame\.webp/);
  assert.match(docs[2], /energy-bar-frame\.webp/);
});
