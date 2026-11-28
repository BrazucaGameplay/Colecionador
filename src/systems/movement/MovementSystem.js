const ARRIVAL_DISTANCE = 3;
const COLLISION_RADIUS = 10;
const MAX_DELTA = 50;

export default class MovementSystem {
  constructor(player, navigation) {
    this.player = player; this.navigation = navigation; this.route = [];
    this.destination = null; this.paused = false; this.hasManualDestination = false;
  }
  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.paused) this.player?.setMoving(false);
  }
  setDestination(x, y) {
    const accepted = this.setRoute(x, y);
    if (!accepted) this.clearDestination();
    this.hasManualDestination = accepted;
    return accepted;
  }
  setAutomaticDestination(x, y) {
    if (this.hasManualDestination || this.paused) return false;
    return this.setRoute(x, y);
  }
  setRoute(x, y) {
    const target = this.navigation.findNearestWalkablePoint(
      Math.max(0, Math.min(this.navigation.width, x)), Math.max(0, Math.min(this.navigation.height, y))
    );
    if (!target) { if (!this.hasManualDestination) this.stopAutomaticMovement(); return false; }
    const path = this.navigation.findPath(this.player.x, this.player.y, target.x, target.y);
    if (!path.length) { if (!this.hasManualDestination) this.stopAutomaticMovement(); return false; }
    this.route = path; this.destination = target; return true;
  }
  stopAutomaticMovement() {
    if (this.hasManualDestination) return false;
    this.route.length = 0; this.destination = null; this.player?.setMoving(false); return true;
  }
  clearDestination() {
    this.destination = null; this.route.length = 0; this.hasManualDestination = false; this.player?.setMoving(false);
  }
  update(delta = 16.67) {
    if (this.paused || !this.player?.alive || !this.route.length) { this.player?.setMoving(false); return; }
    let remaining = this.player.speed * Math.min(Math.max(delta, 0), MAX_DELTA) / 1000;
    let movedX = 0, movedY = 0;
    while (remaining > 0 && this.route.length) {
      const waypoint = this.route[0], dx = waypoint.x - this.player.x, dy = waypoint.y - this.player.y;
      const distance = Math.hypot(dx, dy), step = Math.min(distance, remaining);
      const nx = distance > 0 ? dx / distance : 0, ny = distance > 0 ? dy / distance : 0;
      if (!this.tryMove(this.player.x + nx * step, this.player.y + ny * step)) { this.clearDestination(); break; }
      movedX = nx; movedY = ny; remaining -= step;
      if (distance <= ARRIVAL_DISTANCE || step >= distance) this.route.shift(); else break;
    }
    if (!this.route.length) {
      this.destination = null; this.hasManualDestination = false; this.player.setMoving(false); return;
    }
    if (Math.hypot(movedX, movedY) > 0.0001) {
      this.player.setFacing(movedX, movedY); this.player.setMoving(true);
    } else this.player.setMoving(false);
  }
  tryMove(x, y) {
    if (this.navigation.isAreaWalkable(x, y, COLLISION_RADIUS)) { this.player.setPosition(x, y); return true; }
    const canX = this.navigation.isAreaWalkable(x, this.player.y, COLLISION_RADIUS);
    const canY = this.navigation.isAreaWalkable(this.player.x, y, COLLISION_RADIUS);
    if (canX && !canY) { this.player.setPosition(x, this.player.y); return true; }
    if (canY && !canX) { this.player.setPosition(this.player.x, y); return true; }
    return false;
  }
  destroy() { this.clearDestination(); this.player = null; this.navigation = null; }
}