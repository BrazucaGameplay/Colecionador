/**
 * IA de patrulha e perseguição. Toda movimentação respeita a zona de
 * surgimento, a máscara caminhável e os obstáculos de WorldNavigation.
 */
export default class MonsterBehaviorController {
  constructor({ navigation, zone, definition, random = Math.random }) {
    this.navigation = navigation;
    this.zone = zone;
    this.definition = definition;
    this.random = random;
    this.velocityX = 0;
    this.velocityY = 0;
    this.nextDecisionAt = 0;
  }

  stop(monster) {
    this.velocityX = 0;
    this.velocityY = 0;
    monster?.setMoving(false);
  }

  moveToward(monster, target, delta) {
    if (!monster?.alive || !target) return false;
    const dx = target.x - monster.x;
    const dy = target.y - monster.y;
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

    this.velocityX = directionX * speed;
    this.velocityY = directionY * speed;
    monster.setPosition(nextX, nextY);
    monster.setFacing(directionX, directionY);
    monster.setMoving(step > 0);
    return step > 0;
  }

  pursue(monster, player, delta) {
    return this.moveToward(monster, player, delta);
  }

  chooseDirection(now) {
    const behavior = this.definition.behavior || {};
    const min = Math.max(100, Number(behavior.decisionMinMs) || 800);
    const max = Math.max(min, Number(behavior.decisionMaxMs) || 1600);
    const moveChance = Math.max(0, Math.min(1, Number(behavior.moveChance ?? 0.7)));

    if (this.random() < moveChance) {
      const angle = this.random() * Math.PI * 2;
      this.velocityX = Math.cos(angle) * this.definition.speed;
      this.velocityY = Math.sin(angle) * this.definition.speed;
    } else {
      this.velocityX = 0;
      this.velocityY = 0;
    }
    this.nextDecisionAt = now + min + this.random() * (max - min);
  }

  update(monster, now, delta) {
    if (!monster?.alive) return;
    if (now >= this.nextDecisionAt) this.chooseDirection(now);

    if (!this.velocityX && !this.velocityY) {
      monster.setMoving(false);
      return;
    }

    const seconds = Math.min(Math.max(delta, 0), 50) / 1000;
    const nextX = monster.x + this.velocityX * seconds;
    const nextY = monster.y + this.velocityY * seconds;
    const dx = nextX - this.zone.x;
    const dy = nextY - this.zone.y;
    const radius = Number(this.definition.collision?.radius) || 12;
    const zoneRadius = Math.max(0, this.zone.radius - radius);

    if (dx * dx + dy * dy > zoneRadius * zoneRadius ||
        !this.navigation.isAreaWalkable(nextX, nextY, radius)) {
      this.stop(monster);
      return;
    }

    monster.setPosition(nextX, nextY);
    monster.setFacing(this.velocityX, this.velocityY);
    monster.setMoving(true);
  }

  destroy() {
    this.navigation = null;
    this.zone = null;
    this.definition = null;
  }
}