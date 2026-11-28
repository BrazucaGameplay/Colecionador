import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('painéis HTML usam tipografia fina sans-serif', async () => {
  const css = await read('../src/ui/html-game-ui.css');
  assert.match(css, /font-family: system-ui, "Roboto", "Segoe UI", sans-serif/);
  assert.match(css, /\.html-game-ui__stat-label \{ font-weight: 300; \}/);
  assert.match(css, /\.html-game-ui__profile-footer \{ font-weight: 300; \}/);
});

test('painel de perfil contém somente o retrato, sem botões ou textos', async () => {
  const ui = await read('../src/ui/HtmlGameUI.js');
  const profileStart = ui.indexOf('  buildProfile() {');
  const profileEnd = ui.indexOf('\n  refresh() {', profileStart);
  assert.ok(profileStart >= 0 && profileEnd > profileStart);
  const profileBuilder = ui.slice(profileStart, profileEnd);
  assert.match(profileBuilder, /element\('img', 'html-game-ui__profile-portrait'\)/);
  assert.doesNotMatch(profileBuilder, /imageButton|addText|caption|shortcut|pager|summary|stat-row|skinRows/);
  assert.match(ui, /if \(key !== 'profile'\) \{/);
  assert.match(ui, /this\.profilePortraitFrame\.append\(this\.profilePortraitFallback, this\.portrait\)/);
  assert.match(ui, /this\.portrait\.src = portrait/);
  assert.match(ui, /shade\.addEventListener\('pointerdown',[\s\S]*?this\.closePanel\(\)/);
});

test('silhueta de fallback é independente e as artes permanecem transparentes', async () => {
  const [css, ui] = await Promise.all([
    read('../src/ui/html-game-ui.css'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  assert.match(css, /\.html-game-ui__portrait-fallback[\s\S]*?background: radial-gradient/);
  assert.match(css, /\.html-game-ui__portrait-image \{ background: transparent; \}/);
  assert.match(ui, /element\('span', 'html-game-ui__portrait-fallback'\)/);
  assert.match(ui, /addEventListener\('load',[\s\S]*?portraitFallback\.hidden = true/);
  assert.match(ui, /addEventListener\('error',[\s\S]*?portraitFallback\.hidden = false/);
  assert.match(ui, /thumb\.append\(fallback, image\)/);
});
