export const PROFILE_PORTRAIT_FIT = Object.freeze({ width: 0.84, height: 0.50 });

/**
 * Exibe arte de perfil sem distorcer nem reprocessar a textura a cada atualização do HUD.
 * setTexture e setFilter só são executados quando a chave realmente muda.
 */
export function setPortraitTexture(image, textureKey, maxWidth, maxHeight) {
  if (!image || !textureKey || !(maxWidth > 0) || !(maxHeight > 0)) return false;

  const textureChanged = image.texture?.key !== textureKey;
  if (textureChanged) {
    image.setTexture(textureKey);
    const texture = image.texture;
    // LINEAR = 0 no Phaser 4; só definir o filtro ao trocar a textura.
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
