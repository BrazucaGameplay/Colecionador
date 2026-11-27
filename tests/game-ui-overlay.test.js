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

test('GameUI é uma camada separada e não pausa a simulação', async () => {
  const [game, ui] = await Promise.all([read('../src/scenes/Game.js'), read('../src/scenes/GameUI.js')]);
  assert.match(game, /scene\.launch\('GameUI'\)/);
  assert.doesNotMatch(game, /PlayerStatusUI|statusUI/);
  assert.doesNotMatch(game, /scene\.(pause|sleep)\(/);
  assert.match(ui, /setGlobalTopOnly\(false\)/);
  assert.doesNotMatch(ui, /scene\.(pause|sleep|stop)\(/);
  for (const label of ['Bestiário', 'Waifus', 'Inventário', 'Casa']) assert.ok(ui.includes(label));
  assert.match(ui, /openPanel\('profile'\)/);
  assert.match(ui, /this\.hpFill\.setSize/);
  assert.match(ui, /this\.enFill\.setSize/);
});

test('toques na HUD são excluídos da navegação do mundo', async () => {
  const [game, ui] = await Promise.all([read('../src/scenes/Game.js'), read('../src/scenes/GameUI.js')]);
  assert.match(game, /this\.uiScene\?\.isUiPointer\(x, y\)/);
  assert.match(ui, /isUiPointer\(x, y\)/);
  assert.match(ui, /event\?\.stopPropagation\(\)/);
});
