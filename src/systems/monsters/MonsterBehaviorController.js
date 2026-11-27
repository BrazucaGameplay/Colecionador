/**
 * IA de perseguição. A movimentação respeita a zona de surgimento,
 * a máscara caminhável e os obstáculos de WorldNavigation.
 * Parâmetros invariáveis são resolvidos uma única vez, não em cada tick.
 */
export default class MonsterBehaviorController {
  constructor({ navigation, zone, definition }) {
    this.navigation = navigation;
    this.zone = zone;
    this.definition = definition;
    this.speed = Math.max(0, Number(definition?.speed) || 0);
    this.radius = Math.max(0, Number(definition?.collision?.radius) || 12);
    this.zoneX = Number(zone?.x) || 0;
    this.zoneY = Number(zone?.y) || 0;
    this.zoneRadius = Math.max(0, (Number(zone?.radius) || 0) - this.radius);
    this.zoneRadiusSquared = this.zoneRadius * this.zoneRadius;
  }

  stop(monster) { monster?.setMoving(false); }

  pursue(monster, player, delta) {
    if (!monster?.alive || !player) return false;
    const dx = player.x - monster.x;
    const dy = player.y - monster.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= 0.00000001) {
      this.stop(monster);
      return false;
    }

    const distance = Math.sqrt(distanceSquared);
    const seconds = Math.min(Math.max(delta, 0), 50) / 1000;
    const step = Math.min(distance, this.speed * seconds);
    const directionX = dx / distance;
    const directionY = dy / distance;
    const nextX = monster.x + directionX * step;
    const nextY = monster.y + directionY * step;
    const zoneDx = nextX - this.zoneX;
    const zoneDy = nextY - this.zoneY;

    if (zoneDx * zoneDx + zoneDy * zoneDy > this.zoneRadiusSquared ||
        !this.navigation.isAreaWalkable(nextX, nextY, this.radius)) {
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
