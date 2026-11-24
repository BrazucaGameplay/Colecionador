import { tileToWorld, depthForTile } from './IsometricProjection.js';

function isTileRecord(value) {
  return value !== null && typeof value === 'object'
    && Number.isInteger(value.x) && Number.isInteger(value.y)
    && typeof value.texture === 'string' && value.texture.length > 0;
}

export default class IsometricMapRenderer {
  constructor(scene, { tileWidth, tileHeight, originX = 0, originY = 0 }) {
    if (!scene?.add || !Number.isFinite(tileWidth) || tileWidth <= 0
      || !Number.isFinite(tileHeight) || tileHeight <= 0) {
      throw new TypeError('Scene and positive isometric tile dimensions are required.');
    }

    this.scene = scene;
    this.metrics = { tileWidth, tileHeight, originX, originY };
    this.objects = [];
  }

  render(tiles) {
    if (!Array.isArray(tiles)) {
      throw new TypeError('Map tile data must be an array.');
    }

    this.clear();
    const orderedTiles = [...tiles].sort((a, b) => (
      depthForTile(a) - depthForTile(b)
    ));

    for (const tile of orderedTiles) {
      if (!isTileRecord(tile)) {
        this.clear();
        throw new TypeError('Each map tile needs integer x/y coordinates and a texture key.');
      }

      const position = tileToWorld(tile, this.metrics);
      const image = this.scene.add.image(position.x, position.y, tile.texture)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(this.metrics.tileWidth, this.metrics.tileHeight)
        .setDepth(depthForTile(tile));

      this.objects.push(image);
    }

    return [...this.objects];
  }

  clear() {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
  }

  destroy() {
    this.clear();
    this.scene = null;
  }
}
