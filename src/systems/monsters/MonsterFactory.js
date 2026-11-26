import Monster from '../../entities/Monster.js';
import MonsterRenderer from '../../rendering/monsters/MonsterRenderer.js';

export default class MonsterFactory {
  constructor(scene, { navigation, depthManager } = {}) {
    this.scene = scene;
    this.navigation = navigation;
    this.depthManager = depthManager;
    this.sequence = 0;
  }

  create(definition, point, zone) {
    this.sequence += 1;
    const id = definition.id + '-' + zone.id + '-' + this.sequence;
    const entity = new Monster({
      id,
      speciesId: definition.id,
      x: point.x,
      y: point.y,
      definition,
      spawnZoneId: zone.id
    });
    // Entidades distantes nascem apenas como arte estática. Física e IA são
    // construídas sob demanda quando o jogador entra no raio de ativação.
    const renderer = new MonsterRenderer(this.scene, entity, definition, this.depthManager);
    return { entity, body: null, renderer, behavior: null, zone, collider: null, removeAt: null };
  }

  destroy() {
    this.scene = null;
    this.navigation = null;
    this.depthManager = null;
    this.sequence = 0;
  }
}
