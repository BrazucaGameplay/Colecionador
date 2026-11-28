import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('painéis HTML usam tipografia sans-serif e hierarquia legível para atributos', async () => {
  const css = await read('../src/ui/html-game-ui.css');
  assert.match(css, /font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif/);
  assert.match(css, /\.html-game-ui__profile-summary[\s\S]*?font-weight: 800/);
  assert.match(css, /\.html-game-ui__stat-value[\s\S]*?text-align: right/);
  assert.match(css, /\.html-game-ui__stat-label[\s\S]*?word-break: normal/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
});

test('silhueta vetorial fica como fundo dos retratos HTML sem substituir as artes das skins', async () => {
  const [css, ui] = await Promise.all([
    read('../src/ui/html-game-ui.css'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  assert.match(css, /html-game-ui__portrait-image[\s\S]*?background-image: url\("data:image\/svg\+xml/);
  assert.match(ui, /element\('img', 'html-game-ui__portrait-image'\)/);
  assert.match(ui, /html-game-ui__profile-portrait html-game-ui__portrait-image/);
  assert.match(ui, /html-game-ui__skin-thumb html-game-ui__portrait-image/);
  assert.match(ui, /this\.portraitImage\.src = portrait/);
});
