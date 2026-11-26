import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';
import MonsterFactory from './MonsterFactory.js';
import MonsterSpawner from './MonsterSpawner.js';
export default class MonsterManager {
  constructor(scene, { navigation, playerBody, depthManager, spawnZones, definitions = MONSTER_DEFINITIONS, onContact = () => {}, onKill = () => {} } = {}) {
    if (!scene || !navigation || !playerBody?.object || !Array.isArray(spawnZones)) throw new TypeError('MonsterManager exige Scene, navegação, corpo do jogador e zonas.');
    this.scene = scene; this.navigation = navigation; this.playerBody = playerBody; this.definitions = definitions;
    this.onContact = onContact; this.onKill = onKill; this.entries = new Map();
    this.factory = new MonsterFactory(scene, { navigation, depthManager }); this.destroyed = false;
    this.spawner = new MonsterSpawner({
      navigation, spawnZones, definitions,
      canSpawn: definition => this.hasValidIdleTexture(definition),
      createMonster: (definition, point, zone) => this.createMonster(definition, point, zone),
      getAlive: zoneId => this.getAliveInZone(zoneId),
      getPlayerPosition: () => ({ x: this.playerBody.player.x, y: this.playerBody.player.y }),
      isOccupied: (point, radius, zoneId) => this.isOccupied(point, radius, zoneId)
    });
    this.spawner.update(scene.time?.now || 0);
  }
  hasValidIdleTexture(definition) {
    const idle = definition.visual?.animations?.idle;
    return Boolean(definition.visual?.enabled && idle && this.scene.textures.exists(idle.key));
  }
  createMonster(definition, point, zone) {
    const entry = this.factory.create(definition, point, zone);
    entry.collider = this.scene.physics.add.overlap(this.playerBody.object, entry.body.zone, () => this.onContact(entry.entity.id));
    this.entries.set(entry.entity.id, entry);
    return entry;
  }
  getAliveInZone(zoneId) { return [...this.entries.values()].filter(entry => entry.entity.alive && entry.entity.spawnZoneId === zoneId); }
  isOccupied(point, radius, zoneId) {
    for (const entry of this.getAliveInZone(zoneId)) {
      const otherRadius = Number(entry.entity.definition.collision?.radius) || 12;
      const minDistance = radius + otherRadius + 12;
      const dx = point.x - entry.entity.x; const dy = point.y - entry.entity.y;
      if (dx * dx + dy * dy < minDistance * minDistance) return true;
    }
    return false;
  }
  isAlive(id) { return Boolean(this.entries.get(id)?.entity.alive); }
  damage(id, amount = 1, now = this.scene.time.now) {
    const entry = this.entries.get(id);
    if (!entry || !entry.entity.alive) return { applied: 0, dead: false };
    const result = entry.entity.takeDamage(amount);
    if (!result.dead) return result;
    entry.body.setEnabled(false); entry.renderer.play('death');
    entry.removeAt = now + (Number(entry.entity.definition.deathDurationMs) || 600);
    this.spawner.notifyDeath(entry.entity.spawnZoneId, now);
    this.onKill({ monster: entry.entity, experience: entry.entity.definition.experience, drops: entry.entity.definition.drops });
    return result;
  }
  update(now, delta) {
    if (this.destroyed) return;
    this.spawner.update(now);
    for (const [id, entry] of this.entries) {
      if (entry.entity.dead) { if (now >= entry.removeAt) this.remove(id); continue; }
      entry.behavior.update(entry.entity, now, delta);
      entry.body.sync();
      entry.renderer.setTransform(entry.entity.x, entry.entity.y);
      entry.renderer.play(entry.entity.moving ? 'walking' : 'idle');
      entry.renderer.update();
    }
  }
  remove(id) {
    const entry = this.entries.get(id); if (!entry) return false;
    entry.collider?.destroy?.(); entry.body.destroy(); entry.renderer.destroy(); entry.behavior.destroy();
    this.entries.delete(id); return true;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const id of [...this.entries.keys()]) this.remove(id);
    this.spawner?.destroy(); this.factory?.destroy(); this.entries.clear();
    this.scene = null; this.navigation = null; this.playerBody = null; this.definitions = null; this.onContact = null; this.onKill = null;
  }
}
