import { CHARACTER_SKINS } from '../../data/characters/CharacterSkinCatalog.js';

const HTML_UI_ASSETS = Object.freeze([
  'assets/ui/panels/painel_vertical_900x1350_transparente.webp',
  'assets/ui/panels/perfil_moldura_fundo_vermelho.webp',
  'assets/ui/buttons/fechar_circular.svg',
  'assets/ui/buttons/botao_sem_ornamento_central_200x100.webp',
  'assets/ui/buttons/botao_sem_ornamento_central_300x100.webp',
  'assets/ui/buttons/botao_sem_ornamento_central_400x100.webp',
  ...Object.values(CHARACTER_SKINS).map(skin => skin.portrait)
]);

const decodedImages = new Map();
const BASE_URL = import.meta.env?.BASE_URL ?? '/';

/**
 * Downloads and decodes every image that can appear in the HTML panels/HUD.
 * The promise rejects on any missing asset so the game scene cannot start
 * with a broken or still-decoding HTML image.
 */
export async function preloadHtmlUiAssets(onProgress = () => {}) {
  const assets = [...new Set(HTML_UI_ASSETS)];
  let completed = 0;
  onProgress(0, assets.length);

  await Promise.all(assets.map(async path => {
    const url = BASE_URL + path.replace(/^\//, '');
    let image = decodedImages.get(url);
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Não foi possível carregar a imagem da interface: ' + path));
      });
      image.src = url;
      decodedImages.set(url, image);
      try {
        await loaded;
        if (typeof image.decode === 'function') await image.decode();
      } catch (error) {
        decodedImages.delete(url);
        throw error;
      }
    } else if (typeof image.decode === 'function') {
      await image.decode();
    }
    completed++;
    onProgress(completed, assets.length, path);
  }));

  return { total: assets.length, images: decodedImages };
}
