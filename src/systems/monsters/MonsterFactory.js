import Monster from '../../entities/Monster.js';
import MonsterBodyAdapter from '../../entities/MonsterBodyAdapter.js';
import MonsterRenderer from '../../rendering/monsters/MonsterRenderer.js';
import MonsterBehaviorController from './MonsterBehaviorController.js';

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
    const body = new MonsterBodyAdapter(this.scene, entity, definition.collision);
    const renderer = new MonsterRenderer(this.scene, entity, definition, this.depthManager);
    const behavior = new MonsterBehaviorController({
      navigation: this.navigation,
      zone,
      definition
    });

    return { entity, body, renderer, behavior, collider: null, removeAt: null };
  }

  destroy() {
    this.scene = null;
    this.navigation = null;
    this.depthManager = null;
    this.sequence = 0;
  }
}
