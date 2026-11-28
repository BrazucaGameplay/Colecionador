import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('todas as imagens usadas pelos painéis HTML e retratos fazem parte do preloader obrigatório', async () => {
  const [loader, catalog, ui] = await Promise.all([
    read('../src/loading/HtmlUiAssetPreloader.js'),
    read('../src/rendering/characters/CharacterSkinCatalog.js'),
    read('../src/ui/HtmlGameUI.js')
  ]);
  for (const asset of [
    'painel_vertical_900x1350_transparente.webp',
    'perfil_moldura_fundo_vermelho.webp',
    'fechar_circular.svg',
    'botao_sem_ornamento_central_200x100.webp',
    'botao_sem_ornamento_central_300x100.webp',
    'botao_sem_ornamento_central_400x100.webp'
  ]) assert.ok(loader.includes(asset), 'asset ausente no preloader: ' + asset);
  assert.match(loader, /Object\.values\(CHARACTER_SKINS\)\.map\(skin => skin\.portrait\)/);
  assert.match(catalog, /skin_01/);
  assert.match(catalog, /skin_2/);
  assert.match(ui, /assets\/ui\/panels/);
});

test('a cena Preload espera o download e decode das imagens HTML antes de iniciar Game', async () => {
  const preload = await read('../src/scenes/Preload.js');
  assert.match(preload, /async create\(\)/);
  assert.match(preload, /await preloadHtmlUiAssets/);
  assert.ok(preload.indexOf('await preloadHtmlUiAssets') < preload.indexOf("this.scene.start('Game')"));
  assert.match(preload, /colecionador:loading-error/);
  assert.match(preload, /htmlUiAssetsReady/);
});

test('a barra reserva 80% para assets Phaser e progride até 99% enquanto imagens HTML são decodificadas', async () => {
  const preload = await read('../src/scenes/Preload.js');
  const loader = await read('../src/loading/HtmlUiAssetPreloader.js');
  const screen = await read('../src/loading/LoadingScreen.js');
  assert.match(preload, /progress\*80/);
  assert.match(preload, /\.8\+\(\.19\*loaded\/total\)/);
  assert.match(loader, /image\.decode\(\)/);
  assert.match(screen, /showLoadError/);
  assert.match(screen, /colecionador:loading-error/);
});

test('falha de imagem HTML mantém a tela de carregamento visível e impede o início do jogo', async () => {
  const [preload, screen] = await Promise.all([
    read('../src/scenes/Preload.js'), read('../src/loading/LoadingScreen.js')
  ]);
  assert.match(preload, /catch\(error\)[\s\S]*?return;/);
  assert.match(screen, /data-loading-error/);
  assert.match(screen, /Verifique sua conexão e recarregue a página/);
});
