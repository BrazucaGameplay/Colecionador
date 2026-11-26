/**
 * Terreno leve: três materiais são compostos uma única vez num padrão
 * pequeno e repetível. O mundo usa um único TileSprite e uma máscara circular.
 * Não há canvas do tamanho do mapa, múltiplas camadas ou trabalho por frame.
 */
const PATTERN_SIZE = 512;

function materialScore(x, y) {
  const broad = Math.sin(x * 0.026) * 0.34
    + Math.cos(y * 0.031) * 0.29
    + Math.sin((x + y) * 0.018) * 0.23
    + Math.cos((x - y) * 0.021) * 0.14;
  const grain = Math.sin(x * 0.173 + y * 0.117) * 0.035
    + Math.cos(x * 0.091 - y * 0.203) * 0.025;
  return broad + grain;
}

function createAlphaMask(scores, thresholdLow, thresholdHigh) {
  const canvas = document.createElement('canvas');
  canvas.width = PATTERN_SIZE;
  canvas.height = PATTERN_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: false });
  const pixels = context.createImageData(PATTERN_SIZE, PATTERN_SIZE);
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];
    pixels.data[i * 4 + 3] = score >= thresholdLow && score < thresholdHigh ? 255 : 0;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

function quantileThreshold(histogram, targetCount) {
  let count = 0;
  for (let i = 0; i < histogram.length; i++) {
    count += histogram[i];
    if (count >= targetCount) return i;
  }
  return histogram.length - 1;
}

function drawMaskedMaterial(outputContext, source, maskCanvas) {
  const layer = document.createElement('canvas');
  layer.width = PATTERN_SIZE;
  layer.height = PATTERN_SIZE;
  const context = layer.getContext('2d');
  context.drawImage(source, 0, 0, PATTERN_SIZE, PATTERN_SIZE);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(maskCanvas, 0, 0);
  outputContext.drawImage(layer, 0, 0);
  layer.width = 1;
  layer.height = 1;
}

export function composeTerrainPattern(scene, {
  smoothKey = 'terrain-smooth',
  grassKey = 'terrain-grass',
  reliefKey = 'terrain-relief',
  outputKey = 'terrain-composite'
} = {}) {
  const sources = [smoothKey, grassKey, reliefKey].map(key => {
    const source = scene.textures.get(key)?.getSourceImage?.();
    if (!source?.width || !source?.height) throw new Error('Textura de terreno indisponível: ' + key);
    return source;
  });

  const count = PATTERN_SIZE * PATTERN_SIZE;
  const scores = new Float32Array(count);
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < PATTERN_SIZE; y++) {
    for (let x = 0; x < PATTERN_SIZE; x++) {
      const score = materialScore(x, y);
      const index = y * PATTERN_SIZE + x;
      scores[index] = score;
      if (score < min) min = score;
      if (score > max) max = score;
    }
  }

  const histogram = new Uint32Array(256);
  for (let i = 0; i < count; i++) {
    const bin = Math.max(0, Math.min(255, Math.floor((scores[i] - min) / (max - min) * 255)));
    scores[i] = bin;
    histogram[bin]++;
  }
  const grassThreshold = quantileThreshold(histogram, Math.round(count * 0.20));
  const reliefThreshold = quantileThreshold(histogram, Math.round(count * 0.30));

  const canvas = document.createElement('canvas');
  canvas.width = PATTERN_SIZE;
  canvas.height = PATTERN_SIZE;
  const context = canvas.getContext('2d');
  context.drawImage(sources[0], 0, 0, PATTERN_SIZE, PATTERN_SIZE);

  const grassMask = createAlphaMask(scores, 0, grassThreshold + 1);
  const reliefMask = createAlphaMask(scores, grassThreshold + 1, reliefThreshold + 1);
  drawMaskedMaterial(context, sources[1], grassMask);
  drawMaskedMaterial(context, sources[2], reliefMask);

  if (scene.textures.exists(outputKey)) scene.textures.remove(outputKey);
  scene.textures.addCanvas(outputKey, canvas);
  return Object.freeze({
    textureKey: outputKey,
    patternSize: PATTERN_SIZE,
    distribution: Object.freeze({ smooth: 0.70, grass: 0.20, relief: 0.10 })
  });
}

export function createTerrainLayers(scene, {
  diameter = 4096,
  smoothKey = 'terrain-smooth',
  grassKey = 'terrain-grass',
  reliefKey = 'terrain-relief'
} = {}) {
  const pattern = composeTerrainPattern(scene, { smoothKey, grassKey, reliefKey });
  const center = diameter / 2;
  const circleGraphics = scene.add.graphics();
  circleGraphics.fillStyle(0xffffff, 1);
  circleGraphics.fillCircle(center, center, center - 2);
  const circleMask = circleGraphics.createGeometryMask();
  circleGraphics.setVisible(false);

  const terrain = scene.add.tileSprite(0, 0, diameter, diameter, pattern.textureKey)
    .setOrigin(0, 0)
    .setDepth(-1000)
    .setMask(circleMask);

  return {
    tiles: [terrain],
    masks: [circleGraphics],
    distribution: pattern.distribution,
    patternSize: pattern.patternSize
  };
}
