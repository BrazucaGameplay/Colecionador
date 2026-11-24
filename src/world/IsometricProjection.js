function validateTile(tile) {
  return tile !== null && typeof tile === 'object'
    && Number.isFinite(tile.x) && Number.isFinite(tile.y);
}

function validateMetrics(metrics) {
  if (!metrics || !Number.isFinite(metrics.tileWidth) || metrics.tileWidth <= 0
    || !Number.isFinite(metrics.tileHeight) || metrics.tileHeight <= 0
    || !Number.isFinite(metrics.originX ?? 0) || !Number.isFinite(metrics.originY ?? 0)) {
    throw new TypeError('Isometric projection requires positive tile dimensions and finite origins.');
  }
}

export function tileToWorld(tile, metrics) {
  if (!validateTile(tile)) {
    throw new TypeError('Tile coordinates must be finite numbers.');
  }
  validateMetrics(metrics);

  const halfWidth = metrics.tileWidth / 2;
  const halfHeight = metrics.tileHeight / 2;
  const originX = metrics.originX ?? 0;
  const originY = metrics.originY ?? 0;

  return {
    x: originX + ((tile.x - tile.y) * halfWidth),
    y: originY + ((tile.x + tile.y) * halfHeight)
  };
}

export function worldToTile(point, metrics, { round = true } = {}) {
  if (!validateTile(point)) {
    throw new TypeError('World coordinates must be finite numbers.');
  }
  validateMetrics(metrics);

  const halfWidth = metrics.tileWidth / 2;
  const halfHeight = metrics.tileHeight / 2;
  const dx = point.x - (metrics.originX ?? 0);
  const dy = point.y - (metrics.originY ?? 0);
  const x = ((dx / halfWidth) + (dy / halfHeight)) / 2;
  const y = ((dy / halfHeight) - (dx / halfWidth)) / 2;

  return round ? { x: Math.round(x), y: Math.round(y) } : { x, y };
}

export function depthForTile(tile, tieBreak = 0.001) {
  if (!validateTile(tile) || !Number.isFinite(tieBreak) || tieBreak < 0) {
    throw new TypeError('A valid tile and non-negative tie-break are required.');
  }
  return tile.x + tile.y + (tile.x * tieBreak);
}
