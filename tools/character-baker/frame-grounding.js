/**
 * Utilitários puros para enquadramento e pivô de spritesheets.
 * O ponto de apoio é calculado a partir do último pixel visível de cada quadro.
 */
export function getGroundedFitY(baseFitY, poseMinY) {
  if (!Number.isFinite(baseFitY) || !Number.isFinite(poseMinY)) {
    throw new TypeError('As coordenadas do enquadramento precisam ser números finitos.');
  }
  return baseFitY - poseMinY;
}

export function findOpaqueBottomRow(rgba, width, height, alphaThreshold = 24, minPixelsPerRow = 3) {
  if (!rgba || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length < width * height * 4) {
    throw new TypeError('Buffer RGBA ou dimensões do quadro inválidos.');
  }
  for (let y = height - 1; y >= 0; y--) {
    let opaquePixels = 0;
    let longestRun = 0;
    let currentRun = 0;
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > alphaThreshold) {
        opaquePixels++;
        currentRun++;
        longestRun = Math.max(longestRun, currentRun);
      } else {
        currentRun = 0;
      }
    }
    // Ignora ruído isolado de antialiasing; mantém linhas com uma base visível.
    if (opaquePixels >= minPixelsPerRow || longestRun >= 2) return y;
  }
  return -1;
}

export function getOpaqueBottomPivot(bottomOpaqueRow, height) {
  if (!Number.isInteger(height) || height < 1 || !Number.isInteger(bottomOpaqueRow) || bottomOpaqueRow < -1 || bottomOpaqueRow >= height) {
    throw new RangeError('Linha inferior opaca ou altura do quadro inválida.');
  }
  return bottomOpaqueRow >= 0
    ? Math.min(1, (bottomOpaqueRow + 1) / height)
    : 0.84;
}

