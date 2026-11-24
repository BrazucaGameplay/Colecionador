import { worldToTile } from '../world/IsometricProjection.js';

export default class WorldEntitySyncSystem {
  constructor({ player, monsters = [], worldManager, metrics, depthSorting }) {
    if (!player?.sprite || !worldManager
      || typeof worldManager.isWalkable !== 'function'
      || typeof worldManager.setPlayerBodyTile !== 'function'
      || !depthSorting || typeof depthSorting.setWorldDepth !== 'function') {
      throw new TypeError('Player, world manager and depth sorting system are required.');
    }

    this.player = player;
    this.monsters = monsters;
    this.worldManager = worldManager;
    this.metrics = metrics;
    this.depthSorting = depthSorting;
  }

  update() {
    const playerPosition = {
      x: this.player.sprite.x,
      y: this.player.sprite.y
    };
    const playerTile = worldToTile(playerPosition, this.metrics);
    if (this.worldManager.isWalkable(playerTile.x, playerTile.y)) {
      this.worldManager.setPlayerBodyTile(playerTile);
    }
    this.depthSorting.setWorldDepth(this.player.sprite, playerPosition, this.metrics);

    for (const monster of this.monsters) {
      if (!monster?.sprite || monster.dead) continue;
      this.depthSorting.setWorldDepth(
        monster.sprite,
        { x: monster.sprite.x, y: monster.sprite.y },
        this.metrics
      );
    }
  }

  destroy() {
    this.player = null;
    this.monsters = [];
    this.worldManager = null;
    this.depthSorting = null;
  }
}
