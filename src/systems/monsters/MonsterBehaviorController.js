/**
 * IA de perseguição. A movimentação respeita a zona de surgimento,
 * a máscara caminhável e os obstáculos de WorldNavigation.
 */
export default class MonsterBehaviorController {
  constructor({ navigation, zone, definition }) {
    this.navigation = navigation;
    this.zone = zone;
    this.definition = definition;
  }

  stop(monster) {
    monster?.setMoving(false);
  }

  pursue(monster, player, delta) {
    if (!monster?.alive || !player) return false;
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.0001) {
      this.stop(monster);
      return false;
    }
    const speed = Math.max(0, Number(this.definition.speed) || 0);
    const seconds = Math.min(Math.max(delta, 0), 50) / 1000;
    const step = Math.min(distance, speed * seconds);
    const directionX = dx / distance;
    const directionY = dy / distance;
    const nextX = monster.x + directionX * step;
    const nextY = monster.y + directionY * step;
    const zoneDx = nextX - this.zone.x;
    const zoneDy = nextY - this.zone.y;
    const radius = Number(this.definition.collision?.radius) || 12;
    const zoneRadius = Math.max(0, this.zone.radius - radius);
    if (zoneDx * zoneDx + zoneDy * zoneDy > zoneRadius * zoneRadius ||
        !this.navigation.isAreaWalkable(nextX, nextY, radius)) {
      this.stop(monster);
      return false;
    }
    monster.setPosition(nextX, nextY);
    monster.setFacing(directionX, directionY);
    monster.setMoving(step > 0);
    return step > 0;
  }

  destroy() {
    this.navigation = null;
    this.zone = null;
    this.definition = null;
  }
}
