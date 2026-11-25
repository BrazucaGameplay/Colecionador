/**
 * Enquadramento de spritesheets: mede os pixels efetivamente renderizados,
 * aplica uma escala comum ao clip e alinha a base visível a um chão estável.
 */
export function getOpaqueBounds(rgba, width, height, alphaThreshold = 24) {
  if (!rgba || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length < width * height * 4) throw new TypeError('Buffer RGBA ou dimensões do quadro inválidos.');
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (rgba[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function getFramePlacement(bounds, maxBounds, frameSize, padding = 8, targetContentHeight = frameSize - padding * 2) {
  if (!bounds || !maxBounds || !Number.isInteger(frameSize) || frameSize < 1 ||
      !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) ||
      !Number.isFinite(maxBounds.width) || !Number.isFinite(maxBounds.height) ||
      bounds.width <= 0 || bounds.height <= 0 || maxBounds.width < bounds.width || maxBounds.height < bounds.height ||
      !Number.isFinite(padding) || padding < 0 || padding * 2 >= frameSize ||
      !Number.isFinite(targetContentHeight) || targetContentHeight <= 0) throw new RangeError('Limites ou dimensões para normalização do quadro inválidos.');
  const available = frameSize - padding * 2;
  const targetHeight = Math.min(available, targetContentHeight);
  const scale = Math.min(targetHeight / maxBounds.height, available / maxBounds.width);
  const width = bounds.width * scale, height = bounds.height * scale;
  return { x: (frameSize - width) / 2, y: frameSize - padding - height, width, height, scale, pivotY: (frameSize - padding) / frameSize };
}
