import { worldToTile, depthForTile } from './IsometricProjection.js';

export default class DepthSortingSystem {
  setTileDepth(gameObject, tilePosition, offset = 0) {
    if (!gameObject || typeof gameObject.setDepth !== 'function') {
      throw new TypeError('A depth-sortable game object is required.');
    }
    if (!Number.isFinite(offset)) {
      throw new TypeError('Depth offset must be a finite number.');
    }
    gameObject.setDepth(depthForTile(tilePosition) + offset);
    return gameObject;
  }

  setWorldDepth(gameObject, worldPosition, metrics, offset = 0) {
    const tilePosition = worldToTile(worldPosition, metrics, { round: false });
    return this.setTileDepth(gameObject, tilePosition, offset);
  }
}
