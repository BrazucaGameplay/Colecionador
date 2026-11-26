const ARRIVAL_DISTANCE = 3;
const COLLISION_RADIUS = 10;
const MAX_DELTA = 50;

/**
 * Tap-to-move path follower. It receives destinations from touch input,
 * but knows nothing about screens, Phaser input, sprites or the GLB.
 * WorldNavigation already uses 8-neighbour A*, including diagonal corner
 * checks, so routes can naturally use all eight directions.
 */
export default class MovementSystem {
  constructor(player, navigation) {
    this.player = player;
    this.navigation = navigation;
    this.route = [];
    this.destination = null;
    this.paused = false;
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.paused) this.player?.setMoving(false);
  }

  setDestination(x, y) {
    const target = this.navigation.findNearestWalkablePoint(
      Math.max(0, Math.min(this.navigation.width, x)),
      Math.max(0, Math.min(this.navigation.height, y))
    );

    if (!target) {
      this.clearDestination();
      return false;
    }

    const path = this.navigation.findPath(
      this.player.x, this.player.y, target.x, target.y
    );

    if (!path.length) {
      this.clearDestination();
      return false;
    }

    this.route = path;
    this.destination = target;
    return true;
  }

  clearDestination() {
    this.destination = null;
    this.route.length = 0;
    this.player?.setMoving(false);
  }

  update(delta = 16.67) {
    if (this.paused) {
      this.player?.setMoving(false);
      return;
    }
    if (!this.player?.alive || !this.route.length) {
      this.player?.setMoving(false);
      return;
    }

    const seconds = Math.min(Math.max(delta, 0), MAX_DELTA) / 1000;
    let remaining = this.player.speed * seconds;
    let movedX = 0;
    let movedY = 0;

    // Consume short path segments without introducing a frame-rate dependent
    // pause at each A* cell.
    while (remaining > 0 && this.route.length) {
      const waypoint = this.route[0];
      const dx = waypoint.x - this.player.x;
      const dy = waypoint.y - this.player.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= ARRIVAL_DISTANCE || distance <= remaining) {
        const step = Math.min(distance, remaining);
        const nx = distance > 0 ? dx / distance : 0;
        const ny = distance > 0 ? dy / distance : 0;
        const candidateX = this.player.x + nx * step;
        const candidateY = this.player.y + ny * step;

        if (!this.tryMove(candidateX, candidateY)) {
          this.clearDestination();
          break;
        }

        movedX = nx;
        movedY = ny;
        remaining -= step;
        if (distance <= ARRIVAL_DISTANCE || step >= distance) this.route.shift();
      } else {
        const nx = dx / distance;
        const ny = dy / distance;
        const candidateX = this.player.x + nx * remaining;
        const candidateY = this.player.y + ny * remaining;

        if (!this.tryMove(candidateX, candidateY)) {
          this.clearDestination();
          break;
        }

        movedX = nx;
        movedY = ny;
        remaining = 0;
      }
    }

    if (!this.route.length) {
      this.destination = null;
      this.player.setMoving(false);
      return;
    }

    if (Math.hypot(movedX, movedY) > 0.0001) {
      this.player.setFacing(movedX, movedY);
      this.player.setMoving(true);
    } else {
      this.player.setMoving(false);
    }
  }

  tryMove(x, y) {
    if (this.navigation.isAreaWalkable(x, y, COLLISION_RADIUS)) {
      this.player.setPosition(x, y);
      return true;
    }

    // Axis fallback allows sliding along a boundary without cutting a corner.
    const canX = this.navigation.isAreaWalkable(x, this.player.y, COLLISION_RADIUS);
    const canY = this.navigation.isAreaWalkable(this.player.x, y, COLLISION_RADIUS);
    if (canX && !canY) {
      this.player.setPosition(x, this.player.y);
      return true;
    }
    if (canY && !canX) {
      this.player.setPosition(this.player.x, y);
      return true;
    }
    return false;
  }

  destroy() {
    this.clearDestination();
    this.player = null;
    this.navigation = null;
  }
}
