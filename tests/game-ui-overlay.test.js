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

test('GameUI carrega todas as artes finais antes de criar a HUD', async () => {
  const ui = await read('../src/scenes/GameUI.js');
  for (const key of ['ui-panel-vertical','ui-panel-profile','ui-button-menu','ui-button-200','ui-button-300','ui-button-400','ui-hud-status']) assert.ok(ui.includes(key));
  assert.match(ui, /this\.load\.image/);
  assert.match(ui, /v=20261127-ui-art-v5/);
});

test('GameUI coordena painéis separados e mantém a simulação ativa', async () => {
  const [game, ui] = await Promise.all([read('../src/scenes/Game.js'), read('../src/scenes/GameUI.js')]);
  assert.match(game, /scene\.launch\('GameUI'\)/);
  assert.doesNotMatch(game, /scene\.(pause|sleep)\(/);
  for (const name of ['PlayerHUD','MenuPanel','ProfilePanel','BestiaryPanel','WaifuPanel','InventoryPanel','HousePanel']) assert.ok(ui.includes(name));
  assert.match(ui, /this\.hud\.setPlayer/);
});

test('toques na HUD e nos painéis não são enviados ao movimento do mundo', async () => {
  const [bootstrap, ui, hud] = await Promise.all([read('../src/systems/GameSystemsBootstrap.js'),read('../src/scenes/GameUI.js'),read('../src/ui/HUD/PlayerHUD.js')]);
  assert.match(bootstrap, /scene\.uiScene\?\.isUiPointer\(x, y\)/);
  assert.match(ui, /isUiPointer\(x, y\)/);
  assert.match(ui, /Boolean\(this\.activePanel\)/);
  assert.match(hud, /containsScreenPoint/);
});

test('HUD usa a moldura enviada e mantém preenchimentos dinâmicos', async () => {
  const [hud,bars]=await Promise.all([read('../src/ui/HUD/PlayerHUD.js'),read('../src/ui/HUD/StatusBars.js')]);
  assert.match(hud,/ui-button-menu/); assert.match(hud,/player-portrait/); assert.match(hud,/onProfile/); assert.match(bars,/ui-hud-status/);
  assert.match(bars,/healthRatio/); assert.match(bars,/energyRatio/);
  assert.match(bars,/setSize\(this\.hpMaxWidth \* this\.healthRatio/);
  assert.match(bars,/setSize\(this\.energyMaxWidth \* this\.energyRatio/);
});

test('painéis usam molduras sem deformar a proporção original', async () => {
  const [frame,menu,profile,info]=await Promise.all([read('../src/ui/components/PanelFrame.js'),read('../src/ui/panels/MenuPanel.js'),read('../src/ui/panels/ProfilePanel.js'),read('../src/ui/panels/InfoPanel.js')]);
  assert.match(frame,/956 \/ 1406/); assert.match(frame,/1383 \/ 947/);
  assert.match(frame,/setDisplaySize\(this\.width, this\.height\)/);
  assert.match(menu,/variant: 'wide'/); assert.match(profile,/variant: 'vertical'/); assert.match(info,/variant: 'wide'/);
});

test('todos os painéis compartilham a moldura e liberam seus objetos', async () => {
  const names=['MenuPanel','ProfilePanel','BestiaryPanel','WaifuPanel','InventoryPanel','HousePanel'];
  const sources=await Promise.all(names.map(name=>read('../src/ui/panels/'+name+'.js')));
  for(const source of sources) assert.match(source,/PanelFrame|InfoPanel/);
  assert.match(await read('../src/ui/panels/InfoPanel.js'),/destroy\(\)/);
  assert.match(await read('../src/ui/components/PanelFrame.js'),/destroy\(\)/);
});

test('as artes WebP da interface e os novos retratos PNG existem e são carregáveis', async () => {
  const paths=[
    '../public/assets/ui/panels/painel_vertical_900x1350_transparente.webp',
    '../public/assets/ui/panels/perfil_moldura_fundo_vermelho.webp',
    '../public/assets/ui/buttons/botao_menu_400x100_transparente.webp',
    '../public/assets/ui/buttons/botao_sem_ornamento_central_200x100.webp',
    '../public/assets/ui/buttons/botao_sem_ornamento_central_300x100.webp',
    '../public/assets/ui/buttons/botao_sem_ornamento_central_400x100.webp',
    '../public/assets/ui/hud/moldura_hp_energia_sem_barras_600px.webp',
  ];
  for(const path of paths){const bytes=await readFile(new URL(path,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
  for(const path of ['../public/assets/characters/sprites/skin_01/perfil.png','../public/assets/characters/sprites/skin_2/perfil.png']){
    const bytes=await readFile(new URL(path,import.meta.url));
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.ok(bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0,'o PNG deve ter dimensões válidas');
  }
});

test('retratos são carregados a partir da pasta de cada skin', async () => {
  const [ui, catalog] = await Promise.all([
    read('../src/scenes/GameUI.js'),
    read('../src/rendering/characters/CharacterSkinCatalog.js')
  ]);
  assert.match(ui, /CHARACTER_SKINS/);
  assert.ok(ui.includes('skin.portraitKey'));
  assert.ok(ui.includes('skin.portrait'));
  assert.ok(catalog.includes('skin_01/perfil.png'));
  assert.ok(catalog.includes('skin_2/perfil.png'));
});

test('HUD recupera o retrato clicável e ajusta as barras com preenchimento integral', async () => {
  const [hud, bars, button, frame] = await Promise.all([
    read('../src/ui/HUD/PlayerHUD.js'), read('../src/ui/HUD/StatusBars.js'),
    read('../src/ui/components/MenuButton.js'), read('../src/ui/components/PanelFrame.js')
  ]);
  assert.match(hud, /onProfile/);
  assert.match(hud, /player-portrait/);
  assert.match(hud, /this\.statusBars\.top - HUD_PORTRAIT_CENTER_OFFSET_Y/);
  assert.match(hud, /HUD_PORTRAIT_MAX_WIDTH = 72/);
  assert.match(hud, /HUD_PORTRAIT_MAX_HEIGHT = 96/);
  assert.match(hud, /width: 132, height: 33/);
  assert.match(bars, /116 \* this\.scaleX/);
  assert.match(bars, /420 \* this\.scaleX/);
  assert.match(bars, /24 \* this\.scaleY/);
  assert.match(bars, /26 \* this\.scaleY/);
  assert.match(button, /Palatino Linotype/);
  assert.match(frame, /Palatino Linotype/);
});

test('menu principal não contém a opção Perfil', async () => {
  const menu = await read('../src/ui/panels/MenuPanel.js');
  assert.doesNotMatch(menu, /\['Perfil',\s*'profile'\]/);
  assert.match(menu, /\['Bestiário',\s*'bestiary'\]/);
});


test('menu principal preserva a moldura inferior e identifica o controle como FPS', async () => {
  const menu = await read('../src/ui/panels/MenuPanel.js');
  const button = await read('../src/ui/components/MenuButton.js');
  assert.match(menu, /width: 600, height: 460/);
  assert.match(menu, /label: 'FPS'/);
  assert.doesNotMatch(menu, /DESEMPENHO|DESATIVADO|ATIVO/);
  assert.match(button, /setResolution\(3\)/);
});


test('perfil começa no retrato da HUD e permite avançar para os atributos', async () => {
  const profile = await read('../src/ui/panels/ProfilePanel.js');
  assert.match(profile, /'player-portrait'/);
  assert.match(profile, /setPage\(0\)/);
  assert.match(profile, /setPage\(this\.page \+ 1\)/);
  assert.match(profile, /1 \/ 3/);
  assert.match(profile, /row\.plus\.background\.setVisible/);
  assert.match(profile, /row\.plus\.label\.setVisible/);
});


test('todos os painéis usam botão circular de fechar no canto superior direito', async () => {
  const [frame, button] = await Promise.all([read('../src/ui/components/PanelFrame.js'), read('../src/ui/components/MenuButton.js')]);
  assert.match(frame, /texture: 'ui-close-button'/);
  assert.match(frame, /this\.width \* 0\.875/);
  assert.match(frame, /this\.height \* 0\.155/);
  assert.match(button, /scene\.add\.image/);
  assert.match(frame, /texture: 'ui-close-button'/);
});


test('perfil não exibe título e todos os painéis usam o botão circular da arte de referência', async () => {
  const [profile, frame, ui, closeAsset] = await Promise.all([
    read('../src/ui/panels/ProfilePanel.js'),
    read('../src/ui/components/PanelFrame.js'),
    read('../src/scenes/GameUI.js'),
    read('../public/assets/ui/buttons/fechar_circular.svg')
  ]);
  assert.match(profile, /title: ''/);
  assert.match(frame, /x: this\.x \+ this\.width \* 0\.875/);
  assert.match(frame, /y: this\.y \+ this\.height \* 0\.155/);
  assert.match(frame, /texture: 'ui-close-button'/);
  assert.match(ui, /ui-close-button/);
  assert.match(ui, /v=20261127-ui-art-v5/);
  assert.match(closeAsset, /<svg/);
  assert.match(closeAsset, /url\(#red\)/);
});
