export const PROFILE_PORTRAIT_FIT = Object.freeze({ width: 0.88, height: 0.58 });

/**
 * Exibe o PNG original sem distorção, mantendo uma única textura carregada.
 * O tamanho de exibição é calculado a partir do frame original, sem gerar cópias.
 */
export function setPortraitTexture(image, textureKey, maxWidth, maxHeight) {
  if (!image || !textureKey || !(maxWidth > 0) || !(maxHeight > 0)) return false;

  const textureChanged = image.texture?.key !== textureKey;
  if (textureChanged) {
    image.setTexture(textureKey);
    // LINEAR preserva a aparência ilustrada; não reprocessamos a imagem nem
    // criamos versões reduzidas. O dimensionamento permanece uniforme.
    const texture = image.texture;
    if (typeof texture?.setFilter === 'function') texture.setFilter(0);
  }

  const frame = image.frame;
  const sourceWidth = Number(frame?.realWidth || frame?.width);
  const sourceHeight = Number(frame?.realHeight || frame?.height);
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) return false;

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  if (Math.abs((image.scaleX ?? 0) - scale) > 0.0001 ||
      Math.abs((image.scaleY ?? 0) - scale) > 0.0001) {
    image.setScale(scale);
  }
  return true;
}
