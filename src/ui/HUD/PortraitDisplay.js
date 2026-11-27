/**
 * Troca o retrato e reaplica seu tamanho de interface.
 * Phaser mantém scaleX/scaleY numéricos ao trocar a textura; por isso
 * imagens com resoluções diferentes podem escapar do tamanho original.
 */
export function setPortraitTexture(image, textureKey, width, height) {
  if (!image || !textureKey) return false;
  image.setTexture(textureKey);
  image.setDisplaySize(width, height);
  return true;
}
