import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/ui/styles/html-game-ui.css', import.meta.url), 'utf8');
const frame = readFileSync(new URL('../public/assets/ui/panels/menu_principal_moldura_completa.svg', import.meta.url), 'utf8');

test('menu principal respeita a área segura e preserva a moldura inteira', () => {
  const menu = css.match(/\.html-game-ui__panel--menu \{([\s\S]*?)\n\}/)?.[1] || '';
  const menuArt = css.match(/\.html-game-ui__panel--menu \.html-game-ui__panel-art \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(menu, /width:\s*min\(560px/);
  assert.match(menu, /env\(safe-area-inset-top\)/);
  assert.match(menu, /env\(safe-area-inset-bottom\)/);
  assert.match(menu, /aspect-ratio:\s*1383\s*\/\s*947/);
  assert.match(menu, /max-height:\s*calc\(100% - 16px\)/);
  assert.match(menuArt, /object-fit:\s*contain/);
});

test('FPS ocupa uma cápsula inferior lateral e deixa livre o centro da navegação', () => {
  const fps = css.match(/\.html-game-ui__panel--menu \.html-game-ui__fps-button \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(fps, /left:\s*14%/);
  assert.match(fps, /width:\s*20%/);
  assert.match(fps, /bottom:\s*17%/);
  assert.match(fps, /border-radius:\s*999px/);
  assert.doesNotMatch(fps, /background:\s*transparent/);
});

test('asset vetorial do menu contém a barra inferior contínua e os dois cantos', () => {
  assert.match(frame, /viewBox="0 0 1383 947"/);
  assert.match(frame, /M113 891 H1270/);
  assert.match(frame, /M76 823 C20 848 34 918 91 922/);
  assert.match(frame, /M1307 823 C1363 848 1349 918 1292 922/);
  assert.match(frame, /M691 789 C668 821 644 840 617 884/);
});
