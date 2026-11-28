import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('a inicialização mantém as cenas Game e GameUI separadas', async () => {
  const [main, preload] = await Promise.all([read('../src/main.js'), read('../src/scenes/Preload.js')]);
  assert.match(main, /scene: \[Boot, Preload, Game, GameUI\]/);
  assert.match(preload, /scene\.start\('Game'\)/);
});

test('GameUI mantém somente os elementos centrais da HUD no canvas Phaser', async () => {
  const [ui, hud] = await Promise.all([read('../src/scenes/GameUI.js'), read('../src/ui/HUD/PlayerHUD.js')]);
  assert.match(ui, /new HtmlGameUI/);
  assert.match(ui, /new PlayerHUD/);
  assert.match(ui, /ui-button-menu/);
  assert.match(ui, /ui-hud-status/);
  assert.doesNotMatch(ui, /new ProfilePanel|new MenuPanel|new BestiaryPanel/);
  assert.doesNotMatch(hud, /scene\.add\.image\(0, 0, 'player-portrait'\)/);
  assert.match(hud, /new StatusBars/);
});

test('camada HTML bloqueia interação com o mundo e acompanha o redimensionamento', async () => {
  const [ui, bootstrap, html] = await Promise.all([
    read('../src/scenes/GameUI.js'), read('../src/systems/GameSystemsBootstrap.js'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  assert.match(ui, /htmlUI\?\.isUiPointer/);
  assert.match(ui, /this\.htmlUI\?\.layout\(\)/);
  assert.match(bootstrap, /scene\.uiScene\?\.isUiPointer\(x, y\)/);
  assert.match(html, /pointer-events: true|pointerdown/);
  assert.match(html, /aria-modal/);
  assert.match(html, /closePanel/);
});

test('painéis e retratos usam HTML nativo sem carregar as imagens de perfil no Phaser', async () => {
  const [ui, html, css] = await Promise.all([
    read('../src/scenes/GameUI.js'), read('../src/ui/HtmlGameUI.js'),
    read('../src/ui/html-game-ui.css')
  ]);
  assert.doesNotMatch(ui, /CHARACTER_SKINS|skin\.portrait/);
  assert.match(html, /document\.createElement\(tag\)/);
  assert.match(html, /skin\.portrait/);
  assert.match(html, /assets\/ui\/panels/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /aspect-ratio/);
});

test('menu e painéis informativos permanecem disponíveis; perfil mostra somente o retrato', async () => {
  const html = await read('../src/ui/HtmlGameUI.js');
  for (const value of ['bestiary','waifus','inventory','house','profile','getSelectedDefinition','this.portrait.src']) {
    assert.ok(html.includes(value), 'faltou integração: ' + value);
  }
  const start = html.indexOf('  buildProfile() {');
  const end = html.indexOf('\n  refresh() {', start);
  const builder = html.slice(start, end);
  assert.match(builder, /html-game-ui__profile-portrait/);
  assert.match(builder, /this\.statsPage = element/);
  assert.match(builder, /this\.skillsPage = element/);
  assert.match(builder, /imageButton\('‹', UI\.button200/);
  assert.match(builder, /imageButton\('›', UI\.button200/);
  assert.match(builder, /html-game-ui__profile-controls/);
  assert.match(html, /this\.setPage\(this\.page \+ 1\)/);
  assert.match(html, /this\.game\?\.skillManager\?\.equip\?\.\(id\)/);
  assert.match(html, /STAT_UPGRADES/);
  assert.match(html, /allocateStat\(key\)/);
});

test('retratos HTML acompanham troca de skin e a HUD continua clicável', async () => {
  const [html, hud, game] = await Promise.all([
    read('../src/ui/HtmlGameUI.js'), read('../src/ui/HUD/PlayerHUD.js'),
    read('../src/scenes/Game.js')
  ]);
  assert.match(html, /getSelectedDefinition/);
  assert.match(html, /this\.portraitImage\.src/);
  assert.match(html, /openProfile/);
  assert.match(hud, /onMenu/);
  assert.match(game, /uiScene\?\.refreshHud/);
});

test('HTML panels and profile portraits are disposed when closed or the UI scene shuts down', async () => {
  const [html, ui] = await Promise.all([read('../src/ui/HtmlGameUI.js'), read('../src/scenes/GameUI.js')]);
  assert.match(html, /this\.root\?\.remove\(\)/);
  assert.match(html, /this\.node\?\.remove\(\)/);
  assert.match(ui, /this\.htmlUI\?\.destroy\(\)/);
});
