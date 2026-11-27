import Monster from '../../entities/Monster.js';
import MonsterRenderer from '../../rendering/monsters/MonsterRenderer.js';

const MAX_POOLED_RENDERERS = 50;

export default class MonsterFactory {
  constructor(scene, { depthManager } = {}) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.sequence = 0;
    this.rendererPool = [];
  }

  create(definition, point, zone) {
    const id = definition.id + '-' + zone.id + '-' + (++this.sequence);
    const entity = new Monster({
      id, speciesId: definition.id, x: point.x, y: point.y,
      definition, spawnZoneId: zone.id
    });
    const renderer = this.rendererPool.pop()?.reset(entity, definition) ||
      new MonsterRenderer(this.scene, entity, definition, this.depthManager);
    return { entity, renderer, behavior: null, zone, mode: 'dormant', removeAt: null,
      nextSimulationAt: 0, lastSimulationAt: 0, lastMoving: false };
  }

  release(entry) {
    if (!entry?.renderer) return false;
    const renderer = entry.renderer;
    entry.renderer = null;
    if (this.rendererPool.length < MAX_POOLED_RENDERERS) {
      renderer.release();
      this.rendererPool.push(renderer);
    } else renderer.destroy();
    return true;
  }

  destroy() {
    for (const renderer of this.rendererPool) renderer.destroy();
    this.rendererPool.length = 0;
    this.scene = null;
    this.depthManager = null;
    this.sequence = 0;
  }
}
