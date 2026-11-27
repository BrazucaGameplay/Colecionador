/**
 * Exibe retratos dentro de uma caixa sem deformar a arte.
 * A textura original permanece intacta: apenas a escala do objeto Phaser muda.
 */
export function setPortraitTexture(image, textureKey, maxWidth, maxHeight) {
  if (!image || !textureKey || !(maxWidth > 0) || !(maxHeight > 0)) return false;
  image.setTexture(textureKey);
  const frame = image.frame;
  const sourceWidth = Number(frame?.realWidth || frame?.width);
  const sourceHeight = Number(frame?.realHeight || frame?.height);
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) return false;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
  return true;
}
