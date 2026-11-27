/**
 * Exibe retratos ilustrados em alta qualidade dentro de uma caixa sem deformar a arte.
 * A textura-fonte nunca é reamostrada nem alterada; somente a escala de exibição muda.
 */
export function setPortraitTexture(image, textureKey, maxWidth, maxHeight) {
  if (!image || !textureKey || !(maxWidth > 0) || !(maxHeight > 0)) return false;
  image.setTexture(textureKey);
  const texture = image.texture;
  // Phaser 4: LINEAR = 0. Indicado para ilustrações detalhadas redimensionadas.
  if (typeof texture?.setFilter === 'function') texture.setFilter(0);

  const frame = image.frame;
  const sourceWidth = Number(frame?.realWidth || frame?.width);
  const sourceHeight = Number(frame?.realHeight || frame?.height);
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) return false;

  // "Contain" com um único fator: preserva a proporção e ocupa o maior espaço possível.
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
  return true;
}
