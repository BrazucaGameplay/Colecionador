import WorldCore from './WorldCore.js';
import IsometricMapRenderer from './IsometricMapRenderer.js';

export default class WorldManager {
  #core;
  #renderer;

  constructor({
    scene,
    width,
    height,
    blockedTiles = [],
    playerBodyTile = { x: 0, y: 0 },
    tileWidth,
    tileHeight,
    originX = 0,
    originY = 0
  }) {
    if (!scene) throw new TypeError('A Phaser scene is required.');
    this.width = width;
    this.height = height;
    this.#core = new WorldCore({ width, height, blockedTiles, playerBodyTile });
    this.#renderer = new IsometricMapRenderer(scene, {
      tileWidth,
      tileHeight,
      originX,
      originY
    });
  }

  isInside(tx, ty) {
    return Number.isInteger(tx) && Number.isInteger(ty)
      && tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  isWalkable(tx, ty) {
    return this.#core.isWalkable(tx, ty);
  }

  findPath(start, goal) {
    return this.core.findPath(start, goal);
  }

  getPlayerBodyTile() {
    return this.core.getPlayerBodyTile();
  }

  setPlayerBodyTile(tile) {
    return this.core.setPlayerBodyTile(tile);
  }

  render(tiles) {
    if (!Array.isArray(tiles)) {
      throw new TypeError('World visual data must be an array.');
    }
    for (const tile of tiles) {
      if (!tile || !this.isInside(tile.x, tile.y)) {
        throw new RangeError('Visual tile is outside the configured world bounds.');
      }
    }
    return this.#renderer.render(tiles);
  }

  destroy() {
    this.renderer.destroy();
  }
}
