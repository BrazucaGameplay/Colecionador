import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/ui/html-game-ui.css', import.meta.url), 'utf8');

test('menu principal respeita a área segura e preserva a moldura inteira', () => {
  const shade = css.match(/\.html-game-ui__shade \{([\s\S]*?)\n\}/)?.[1] || '';
  const menu = css.match(/\.html-game-ui__panel--menu \{([\s\S]*?)\n\}/)?.[1] || '';
  const art = css.match(/\.html-game-ui__panel-art \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(shade, /box-sizing:\s*border-box/);
  assert.match(shade, /env\(safe-area-inset-top\)/);
  assert.match(shade, /env\(safe-area-inset-bottom\)/);
  assert.match(menu, /width:\s*min\(560px/);
  assert.match(menu, /aspect-ratio:\s*1383\s*\/\s*947/);
  assert.match(art, /object-fit:\s*contain/);
});

test('FPS ocupa uma cápsula inferior lateral e deixa livre o centro da navegação', () => {
  const fps = css.match(/\.html-game-ui__panel--menu \.html-game-ui__fps-button \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(fps, /left:\s*14%/);
  assert.match(fps, /width:\s*20%/);
  assert.match(fps, /bottom:\s*17%/);
  assert.match(fps, /border-radius:\s*999px/);
  assert.doesNotMatch(fps, /background:\s*transparent/);
});
