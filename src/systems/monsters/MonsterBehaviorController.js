/**
 * IA inicial de patrulha curta. A movimentação é lógica e respeita a zona
 * de surgimento e a máscara/obstáculos de WorldNavigation.
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
    const zoneRadius = Math.max(0, this.zone.radius - (this.definition.collision?.radius || 12));

    if (dx * dx + dy * dy > zoneRadius * zoneRadius ||
        !this.navigation.isAreaWalkable(nextX, nextY, this.definition.collision?.radius || 12)) {
      this.velocityX = 0;
      this.velocityY = 0;
      monster.setMoving(false);
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
