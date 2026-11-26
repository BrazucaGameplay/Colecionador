/**
 * Composição determinística do terreno por TileSprites.
 * A distribuição é calculada em células e convertida em máscaras geométricas;
 * não existe renderização intermediária em canvas com o tamanho do mapa.
 */
const DEFAULT_CELL_SIZE = 64;

function hashCell(x, y) {
  let value = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 2246822519);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function terrainScore(x, y) {
  const broad = Math.sin(x * 0.0019) * 0.8
    + Math.cos(y * 0.0023) * 0.75
    + Math.sin((x + y) * 0.0013) * 0.55
    + Math.cos((x - y) * 0.0017) * 0.35;
  return broad + (hashCell(x, y) - 0.5) * 0.9;
}

/**
 * Cada célula elegível pertence a apenas uma classe. A ordenação por campo
 * espacial de baixa frequência produz manchas distribuídas, não quadrantes.
 * A contagem é quantizada pela resolução da grade (64 unidades por célula).
 */
export function buildTerrainRegions({ diameter = 4096, cellSize = DEFAULT_CELL_SIZE } = {}) {
  if (!Number.isInteger(diameter) || diameter <= 0 || !Number.isInteger(cellSize) || cellSize <= 0) {
    throw new RangeError('Diâmetro e tamanho de célula devem ser inteiros positivos.');
  }
  const radius = diameter / 2;
  const center = radius;
  const eligible = [];
  const columns = Math.ceil(diameter / cellSize);
  const rows = Math.ceil(diameter / cellSize);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = column * cellSize;
      const y = row * cellSize;
      const width = Math.min(cellSize, diameter - x);
      const height = Math.min(cellSize, diameter - y);
      const cx = x + width / 2;
      const cy = y + height / 2;
      const halfDiagonal = Math.hypot(width, height) / 2;
      // Só células totalmente internas são usadas nos overlays; a máscara
      // circular externa continua definindo o recorte visual exato da ilha.
      if (Math.hypot(cx - center, cy - center) + halfDiagonal > radius - 2) continue;
      eligible.push({ x, y, width, height, score: terrainScore(cx, cy) });
    }
  }

  // Divide a ilha em 4 x 4 setores e calcula as proporções dentro de
  // cada setor. Isso impede que o campo de ruído concentre os overlays
  // numa única região do mapa.
  const sectors = new Map();
  for (const cell of eligible) {
    const sectorX = Math.min(3, Math.floor((cell.x + cell.width / 2) / (diameter / 4)));
    const sectorY = Math.min(3, Math.floor((cell.y + cell.height / 2) / (diameter / 4)));
    const key = sectorY * 4 + sectorX;
    if (!sectors.has(key)) sectors.set(key, []);
    sectors.get(key).push(cell);
  }

  const grassCells = [];
  const reliefCells = [];
  const sectorDistribution = {};
  let smoothCount = 0;
  for (const [key, sectorCells] of sectors) {
    sectorCells.sort((a, b) => a.score - b.score);
    const grassCount = Math.round(sectorCells.length * 0.20);
    const reliefCount = Math.round(sectorCells.length * 0.10);
    grassCells.push(...sectorCells.slice(0, grassCount));
    reliefCells.push(...sectorCells.slice(grassCount, grassCount + reliefCount));
    const smoothSectorCount = sectorCells.length - grassCount - reliefCount;
    smoothCount += smoothSectorCount;
    sectorDistribution[key] = Object.freeze({
      eligible: sectorCells.length,
      smooth: smoothSectorCount / sectorCells.length,
      grass: grassCount / sectorCells.length,
      relief: reliefCount / sectorCells.length
    });
  }

  return Object.freeze({
    columns,
    rows,
    eligibleCells: eligible.length,
    smoothCount,
    grassCells: Object.freeze(grassCells.map(({ x, y, width, height }) => Object.freeze({ x, y, width, height }))),
    reliefCells: Object.freeze(reliefCells.map(({ x, y, width, height }) => Object.freeze({ x, y, width, height }))),
    distribution: Object.freeze({
      smooth: smoothCount / eligible.length,
      grass: grassCells.length / eligible.length,
      relief: reliefCells.length / eligible.length
    }),
    sectorDistribution: Object.freeze(sectorDistribution)
  });
}

export function syncTerrainLayersToCamera(tiles, camera) {
  const zoom = Math.max(0.0001, camera.zoom || 1);
  const width = camera.width / zoom;
  const height = camera.height / zoom;
  const x = camera.scrollX;
  const y = camera.scrollY;
  for (const tile of tiles) {
    tile.setSize(width, height);
    tile.setPosition(x + width / 2, y + height / 2);
    tile.setTilePosition(x, y);
  }
}

export function createTerrainLayers(scene, {
  diameter = 4096,
  cellSize = DEFAULT_CELL_SIZE,
  smoothKey = 'terrain-smooth',
  grassKey = 'terrain-grass',
  reliefKey = 'terrain-relief'
} = {}) {
  const regions = buildTerrainRegions({ diameter, cellSize });
  const center = diameter / 2;
  const tiles = [];
  const masks = [];

  const circleGraphics = scene.add.graphics();
  circleGraphics.fillStyle(0xffffff, 1);
  circleGraphics.fillCircle(center, center, center - 2);
  const circleMask = circleGraphics.createGeometryMask();
  circleGraphics.setVisible(false);
  masks.push(circleGraphics);

  const smooth = scene.add.tileSprite(center, center, scene.scale.width, scene.scale.height, smoothKey)
    .setOrigin(0.5)
    .setDepth(-1000)
    .setMask(circleMask);
  tiles.push(smooth);

  const createRegionLayer = (key, cells, depth) => {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    for (const cell of cells) {
      graphics.fillRect(cell.x, cell.y, cell.width + 0.5, cell.height + 0.5);
    }
    const mask = graphics.createGeometryMask();
    graphics.setVisible(false);
    masks.push(graphics);

    const tile = scene.add.tileSprite(center, center, scene.scale.width, scene.scale.height, key)
      .setOrigin(0.5)
      .setDepth(depth)
      .setMask(mask);
    tiles.push(tile);
  };

  createRegionLayer(grassKey, regions.grassCells, -999);
  createRegionLayer(reliefKey, regions.reliefCells, -998);

  return { tiles, masks, distribution: regions.distribution, cellCount: regions.eligibleCells };
}
