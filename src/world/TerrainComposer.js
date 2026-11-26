/**
 * Composição periódica do terreno. O padrão 512x512 é composto uma vez na
 * inicialização; não há canvas do tamanho do mundo nem processamento por frame.
 */
const PATTERN_SIZE = 512;
const TAU = Math.PI * 2;
const EDGE_BLEND = 48;
const smoothstep = (value) => value * value * (3 - 2 * value);

/**
 * Campo harmônico periódico: todas as frequências são inteiras em relação
 * ao período 512, portanto o padrão fecha nas bordas X e Y sem emendas
 * introduzidas pelo mapa de distribuição.
 */
export function materialScore(x, y) {
  const u = TAU / PATTERN_SIZE;
  const broad = Math.sin(u * (2 * x)) * 0.34
    + Math.cos(u * (3 * y)) * 0.29
    + Math.sin(u * (x + y)) * 0.23
    + Math.cos(u * (x - y)) * 0.14;
  const grain = Math.sin(u * (11 * x + 7 * y)) * 0.035
    + Math.cos(u * (5 * x - 13 * y)) * 0.025;
  return broad + grain;
}

function quantileThreshold(histogram, targetCount) {
  let count = 0;
  for (let i = 0; i < histogram.length; i++) {
    count += histogram[i];
    if (count >= targetCount) return i;
  }
  return histogram.length - 1;
}

/**
 * Redimensiona cada material para o padrão e mistura faixas opostas nas
 * bordas. Os pixels extremos ficam iguais nos lados opostos, inclusive nos
 * quatro cantos, para que a textura original também possa ser repetida.
 */
function readSeamlessPixels(source) {
  const canvas = document.createElement('canvas');
  canvas.width = PATTERN_SIZE;
  canvas.height = PATTERN_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0, PATTERN_SIZE, PATTERN_SIZE);
  const image = context.getImageData(0, 0, PATTERN_SIZE, PATTERN_SIZE);
  const original = new Uint8ClampedArray(image.data);
  const horizontal = new Uint8ClampedArray(original.length);

  for (let y = 0; y < PATTERN_SIZE; y++) {
    for (let x = 0; x < PATTERN_SIZE; x++) {
      const edge = Math.min(x, PATTERN_SIZE - 1 - x);
      const weight = edge < EDGE_BLEND
        ? 0.5 * (1 - smoothstep(edge / EDGE_BLEND))
        : 0;
      const oppositeX = PATTERN_SIZE - 1 - x;
      const index = (y * PATTERN_SIZE + x) * 4;
      const opposite = (y * PATTERN_SIZE + oppositeX) * 4;
      for (let channel = 0; channel < 4; channel++) {
        horizontal[index + channel] = original[index + channel] * (1 - weight)
          + original[opposite + channel] * weight;
      }
    }
  }

  const seamless = new Uint8ClampedArray(horizontal.length);
  for (let y = 0; y < PATTERN_SIZE; y++) {
    const edge = Math.min(y, PATTERN_SIZE - 1 - y);
    const weight = edge < EDGE_BLEND
      ? 0.5 * (1 - smoothstep(edge / EDGE_BLEND))
      : 0;
    const oppositeY = PATTERN_SIZE - 1 - y;
    for (let x = 0; x < PATTERN_SIZE; x++) {
      const index = (y * PATTERN_SIZE + x) * 4;
      const opposite = (oppositeY * PATTERN_SIZE + x) * 4;
      for (let channel = 0; channel < 4; channel++) {
        seamless[index + channel] = horizontal[index + channel] * (1 - weight)
          + horizontal[opposite + channel] * weight;
      }
    }
  }

  canvas.width = 1;
  canvas.height = 1;
  return seamless;
}

export function composeTerrainPattern(scene, {
  smoothKey = 'terrain-smooth',
  grassKey = 'terrain-grass',
  reliefKey = 'terrain-relief',
  outputKey = 'terrain-composite'
} = {}) {
  const sources = [smoothKey, grassKey, reliefKey].map(key => {
    const source = scene.textures.get(key)?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      throw new Error('Textura de terreno indisponível: ' + key);
    }
    return readSeamlessPixels(source);
  });

  const count = PATTERN_SIZE * PATTERN_SIZE;
  const scores = new Float32Array(count);
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < PATTERN_SIZE; y++) {
    for (let x = 0; x < PATTERN_SIZE; x++) {
      const index = y * PATTERN_SIZE + x;
      const score = materialScore(x, y);
      scores[index] = score;
      if (score < min) min = score;
      if (score > max) max = score;
    }
  }

  const histogram = new Uint32Array(256);
  for (let i = 0; i < count; i++) {
    const bin = Math.max(0, Math.min(255,
      Math.floor((scores[i] - min) / (max - min) * 255)));
    scores[i] = bin;
    histogram[bin]++;
  }

  const grassThreshold = quantileThreshold(histogram, Math.round(count * 0.20));
  const reliefThreshold = quantileThreshold(histogram, Math.round(count * 0.30));
  const output = document.createElement('canvas');
  output.width = PATTERN_SIZE;
  output.height = PATTERN_SIZE;
  const context = output.getContext('2d');
  const image = context.createImageData(PATTERN_SIZE, PATTERN_SIZE);
  const distribution = { smooth: 0, grass: 0, relief: 0 };

  for (let i = 0; i < count; i++) {
    const bin = scores[i];
    let materialIndex = 0;
    if (bin < grassThreshold + 1) materialIndex = 1;
    else if (bin < reliefThreshold + 1) materialIndex = 2;
    distribution[materialIndex === 0 ? 'smooth' : materialIndex === 1 ? 'grass' : 'relief']++;
    const sourceIndex = i * 4;
    image.data[sourceIndex] = sources[materialIndex][sourceIndex];
    image.data[sourceIndex + 1] = sources[materialIndex][sourceIndex + 1];
    image.data[sourceIndex + 2] = sources[materialIndex][sourceIndex + 2];
    image.data[sourceIndex + 3] = sources[materialIndex][sourceIndex + 3];
  }

  context.putImageData(image, 0, 0);
  if (scene.textures.exists(outputKey)) scene.textures.remove(outputKey);
  scene.textures.addCanvas(outputKey, output);

  const actualDistribution = Object.freeze({
    smooth: distribution.smooth / count,
    grass: distribution.grass / count,
    relief: distribution.relief / count
  });
  return Object.freeze({
    textureKey: outputKey,
    patternSize: PATTERN_SIZE,
    distribution: actualDistribution
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

  // Graphics fora da Display List: serve exclusivamente como geometria da
  // máscara, sem ser desenhado por cima do terreno ou sofrer ordenação de depth.
  const circleGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
  circleGraphics.fillStyle(0xffffff, 1);
  circleGraphics.fillCircle(center, center, center - 2);
  const circleMask = circleGraphics.createGeometryMask();

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
