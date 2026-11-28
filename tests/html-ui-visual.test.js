import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('painéis HTML usam tipografia fina sans-serif e hierarquia legível para atributos', async () => {
  const css = await read('../src/ui/html-game-ui.css');
  assert.match(css, /font-family: system-ui, "Roboto", "Segoe UI", sans-serif/);
  assert.match(css, /\.html-game-ui__profile-summary[\\s\\S]*?font-weight: 800/);
  assert.match(css, /\.html-game-ui__stat-value[\\s\\S]*?text-align: right/);
  assert.match(css, /\.html-game-ui__stat-label[\\s\\S]*?word-break: normal/);
  assert.match(css, /\.html-game-ui__stat-label \\{ font-weight: 300; \\}/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
});

test('silhueta de fallback é independente e não aparece por trás das artes transparentes', async () => {
  const [css, ui] = await Promise.all([
    read('../src/ui/html-game-ui.css'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  assert.match(css, /\.html-game-ui__portrait-fallback[\\s\\S]*?background: radial-gradient/);
  assert.match(css, /\.html-game-ui__portrait-image \\{ background: transparent; \\}/);
  assert.match(ui, /element\('span', 'html-game-ui__portrait-fallback'\)/);
  assert.match(ui, /element\('img', 'html-game-ui__portrait-image'\)/);
  assert.match(ui, /this\.portraitImage\.src = portrait/);
  assert.match(ui, /addEventListener\('load',[\\s\\S]*?portraitFallback\.hidden = true/);
  assert.match(ui, /addEventListener\('error',[\\s\\S]*?portraitFallback\.hidden = false/);
  assert.match(ui, /profileStatKeys = \\['attack', 'defense', 'penetration', 'attackSpeed', 'movementSpeed'\\]/);
});
