import Monster from '../../entities/Monster.js';
import MonsterRenderer from '../../rendering/monsters/MonsterRenderer.js';

export default class MonsterFactory {
  constructor(scene, { depthManager } = {}) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.sequence = 0;
  }

  create(definition, point, zone) {
    const id = definition.id + '-' + zone.id + '-' + (++this.sequence);
    const entity = new Monster({
      id, speciesId: definition.id, x: point.x, y: point.y,
      definition, spawnZoneId: zone.id
    });
    // Monstros nascem como entidades lógicas + imagem. IA só é criada
    // quando entram na faixa de perseguição; não há corpo Arcade inútil.
    const renderer = new MonsterRenderer(this.scene, entity, definition, this.depthManager);
    return { entity, renderer, behavior: null, zone, mode: 'dormant', removeAt: null,
      nextSimulationAt: 0, lastSimulationAt: 0, lastMoving: false };
  }

  destroy() {
    this.scene = null;
    this.depthManager = null;
    this.sequence = 0;
  }
}
