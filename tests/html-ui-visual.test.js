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

test('painel de perfil contém retrato, setas laterais ornamentadas e botão X', async () => {
  const ui = await read('../src/ui/HtmlGameUI.js');
  const profileStart = ui.indexOf('  buildProfile() {');
  const profileEnd = ui.indexOf('\n  refresh() {', profileStart);
  assert.ok(profileStart >= 0 && profileEnd > profileStart);
  const profileBuilder = ui.slice(profileStart, profileEnd);
  assert.match(profileBuilder, /element\('img', 'html-game-ui__profile-portrait'\)/);
  assert.match(profileBuilder, /imageButton\('‹', UI\.button200/);
  assert.match(profileBuilder, /imageButton\('›', UI\.button200/);
  assert.match(profileBuilder, /aria-label', 'Personagem anterior'/);
  assert.match(profileBuilder, /aria-label', 'Próximo personagem'/);
  assert.doesNotMatch(profileBuilder, /addText|caption|shortcut|summary|stat-row|skinRows/);
  assert.match(ui, /const close = element\('button', 'html-game-ui__close'\)/);
  assert.match(ui, /closeImg\.src = UI\.close/);
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
});


test('adaptador de retrato calcula encaixe pelo conteúdo visível e pela área disponível', async () => {
  const source = await read('../src/ui/ProfileImageFitter.js');
  assert.match(source, /calculateContainLayout/);
  assert.match(source, /naturalWidth/);
  assert.match(source, /naturalHeight/);
  assert.match(source, /getImageData/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /this\.resizeObserver\?\.disconnect\(\)/);
  const { calculateContainLayout } = await import('../src/ui/ProfileImageFitter.js');
  const layout = calculateContainLayout(
    1200, 1800,
    { left: 200, top: 100, right: 1000, bottom: 1700 },
    300, 400
  );
  assert.ok(layout.width > 0 && layout.height > 0);
  assert.ok(layout.left + 200 * (layout.width / 1200) >= 0);
  assert.ok(layout.top + 100 * (layout.height / 1800) >= 0);
  assert.ok(layout.left + 1000 * (layout.width / 1200) <= 300);
  assert.ok(layout.top + 1700 * (layout.height / 1800) <= 400);
});

test('o frame do perfil recorta a imagem nos limites internos e o fitter é descartado', async () => {
  const [css, ui] = await Promise.all([
    read('../src/ui/html-game-ui.css'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  assert.match(css, /\.html-game-ui__panel--vertical \.html-game-ui__profile-portrait-frame[\s\S]*?overflow: hidden/);
  assert.match(css, /contain: layout paint/);
  assert.match(ui, /new ProfileImageFitter\(this\.profilePortraitFrame, this\.portrait\)/);
  assert.match(ui, /this\.profileImageFitter\?\.destroy\(\)/);
});


test('setas percorrem apenas skins validadas e atualizam o retrato sem nomes ou indicadores', async () => {
  const ui = await read('../src/ui/HtmlGameUI.js');
  assert.match(ui, /getCatalog\?\.\(\)\.filter\(entry => entry\.selectable\)/);
  assert.match(ui, /manager\.selectSkin\(available\[next\]\.id\)/);
  assert.match(ui, /this\.owner\.refresh\(\)/);
  assert.match(ui, /this\.refreshProfileControls\(\)/);
  assert.match(ui, /element\('div', 'html-game-ui__profile-controls'\)/);
});
