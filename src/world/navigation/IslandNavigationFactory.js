import WorldNavigation from '../WorldNavigation.js';
import { extractTerrainPixels } from './TerrainMaskExtractor.js';

const TERRAIN_ALPHA_THRESHOLD = 160;

/**
 * Cria a navegação da ilha a partir da textura já carregada.
 * Cache e rede ficam deliberadamente fora do caminho crítico de inicialização.
 */
export function createIslandNavigation({
  width,
  height,
  terrainSource,
  maskOptions
}) {
  const navigation = new WorldNavigation(width, height);
  const { pixels, width: maskWidth, height: maskHeight } =
    extractTerrainPixels(terrainSource, maskOptions);

  navigation.setAlphaMask(
    pixels,
    maskWidth,
    maskHeight,
    TERRAIN_ALPHA_THRESHOLD
  );

  return navigation;
}
