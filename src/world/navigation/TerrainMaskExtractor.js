function createCanvas(size) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas indisponível para extrair a máscara do terreno.');
  }
  return document.createElement('canvas');
}

/**
 * Extrai os pixels da textura já decodificada pelo Phaser.
 * Não faz requisições, não conhece navegação e não persiste dados.
 */
export function extractTerrainPixels(source, {
  maxSize = 1024,
  canvasFactory = createCanvas
} = {}) {
  if (!source?.width || !source?.height) {
    throw new Error('Textura do terreno inválida para extração da máscara.');
  }
  if (!Number.isInteger(maxSize) || maxSize < 1) {
    throw new RangeError('O tamanho máximo da máscara deve ser um inteiro positivo.');
  }

  const size = Math.min(maxSize, source.width, source.height);
  const canvas = canvasFactory(size);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Não foi possível criar o contexto 2D da máscara.');

  try {
    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, size, size);
    return Object.freeze({
      pixels: context.getImageData(0, 0, size, size).data,
      width: size,
      height: size
    });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
