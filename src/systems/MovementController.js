import Phaser from 'phaser';

const ARRIVAL_DISTANCE = 9;
const COLLISION_RADIUS = 10;
const MAX_DELTA = 50;

/**
 * Owns player input, click-to-move paths and walkable-area collision.
 * Rendering and animation remain the responsibility of Player.
 */
export default class MovementController {
  constructor(scene, player, navigation, marker) {
    this.scene = scene;
    this.player = player;
    this.navigation = navigation;
    this.marker = marker;
    this.route = [];
    this.destination = null;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys('W,A,S,D');
  }

  setDestination(x, y) {
    const target = this.navigation.findNearestWalkablePoint(
      Phaser.Math.Clamp(x, 0, this.navigation.width),
      Phaser.Math.Clamp(y, 0, this.navigation.height)
    );

    if (!target) {
      this.clearDestination();
      return false;
    }

    const path = this.navigation.findPath(
      this.player.sprite.x,
      this.player.sprite.y,
      target.x,
      target.y
    );

    if (!path.length) {
      this.clearDestination();
      return false;
    }

    this.route = path;
    this.destination = target;
    this.marker?.setPosition(target.x, target.y).setVisible(true);
    return true;
  }

  clearDestination() {
    this.destination = null;
    this.route.length = 0;
    this.marker?.setVisible(false);
  }

  readKeyboard() {
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) x -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) x += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) y -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) y += 1;
    return { x, y };
  }

  update(delta = 16.67) {
    const input = this.readKeyboard();
    let vx = input.x;
    let vy = input.y;

    if (vx || vy) {
      this.clearDestination();
    } else if (this.route.length) {
      const waypoint = this.route[0];
      const dx = waypoint.x - this.player.sprite.x;
      const dy = waypoint.y - this.player.sprite.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= ARRIVAL_DISTANCE) {
        this.route.shift();
        if (!this.route.length) this.clearDestination();
      } else {
        vx = dx / distance;
        vy = dy / distance;
      }
    }

    const length = Math.hypot(vx, vy);
    if (length > 1) {
      vx /= length;
      vy /= length;
    }

    const seconds = Math.min(Math.max(delta, 0), MAX_DELTA) / 1000;
    const x = this.player.sprite.x;
    const y = this.player.sprite.y;
    const nextX = x + vx * this.player.speed * seconds;
    const nextY = y + vy * this.player.speed * seconds;

    // Resolve each axis independently so the player can slide along island edges.
    if (vx && !this.navigation.isAreaWalkable(nextX, y, COLLISION_RADIUS)) vx = 0;
    if (vy && !this.navigation.isAreaWalkable(x, nextY, COLLISION_RADIUS)) vy = 0;

    this.player.move(vx, vy);
  }

  destroy() {
    this.clearDestination();
    this.scene = null;
    this.player = null;
    this.navigation = null;
    this.marker = null;
  }
}
