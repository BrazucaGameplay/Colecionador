import { MONSTER_ACTIVE_DISTANCE_WORLD_UNITS } from '../../config.js';
import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';
import MonsterFactory from './MonsterFactory.js';
import MonsterSpawner from './MonsterSpawner.js';

export const MONSTER_ACTIVE_DISTANCE_SQUARED = MONSTER_ACTIVE_DISTANCE_WORLD_UNITS ** 2;

/** Usa distância ao quadrado para evitar Math.sqrt/Math.hypot no loop de atualização. */
export function isWithinMonsterActivationRange(player, monster) {
  if (!player || !monster || !Number.isFinite(player.x) || !Number.isFinite(player.y) ||
      !Number.isFinite(monster.x) || !Number.isFinite(monster.y)) return false;
  const dx = monster.x - player.x;
  const dy = monster.y - player.y;
  return dx * dx + dy * dy <= MONSTER_ACTIVE_DISTANCE_SQUARED;
}

export default class MonsterManager {
  constructor(scene, { navigation, playerBody, depthManager, spawnZones, definitions = MONSTER_DEFINITIONS, onKill = () => {} } = {}) {
    if (!scene || !navigation || !playerBody?.object || !Array.isArray(spawnZones)) {
      throw new TypeError('MonsterManager exige Scene, navegação, corpo do jogador e zonas.');
    }
    this.scene = scene; this.navigation = navigation; this.playerBody = playerBody;
    this.definitions = definitions; this.onKill = onKill; this.entries = new Map();
    this.factory = new MonsterFactory(scene, { navigation, depthManager }); this.destroyed = false;
    this.spawner = new MonsterSpawner({
      navigation, spawnZones, definitions,
      canSpawn: definition => definition?.spawnable !== false,
      createMonster: (definition, point, zone) => this.createMonster(definition, point, zone),
      getAlive: zoneId => this.getAliveInZone(zoneId),
      getPlayerPosition: () => ({ x: this.playerBody.player.x, y: this.playerBody.player.y }),
      isOccupied: (point, radius, zoneId) => this.isOccupied(point, radius, zoneId)
    });
    this.spawner.update(scene.time?.now || 0);
  }
  createMonster(definition, point, zone) {
    const entry = this.factory.create(definition, point, zone);
    entry.collider = null;
    entry.isActive = null;
    this.entries.set(entry.entity.id, entry);
    return entry;
  }
  getAliveInZone(zoneId) {
    return [...this.entries.values()].filter(entry => entry.entity.alive && entry.entity.spawnZoneId === zoneId);
  }
  getAliveEntities() {
    return [...this.entries.values()].filter(entry => entry.entity.alive).map(entry => entry.entity);
  }
  isOccupied(point, radius, zoneId) {
    for (const entry of this.getAliveInZone(zoneId)) {
      const otherRadius = Number(entry.entity.definition.collision?.radius) || 12;
      const minDistance = radius + otherRadius + 12;
      const dx = point.x - entry.entity.x, dy = point.y - entry.entity.y;
      if (dx * dx + dy * dy < minDistance * minDistance) return true;
    }
    return false;
  }
  isAlive(id) { return Boolean(this.entries.get(id)?.entity.alive); }
  setEntryActive(entry, active, now) {
    if (entry.isActive === active) return;
    entry.isActive = active;
    if (!active) {
      // Congela a simulação sem remover o monstro do mundo ou alterar seu estado/posição.
      entry.behavior.velocityX = 0;
      entry.behavior.velocityY = 0;
      entry.entity.setMoving(false);
      entry.body.setEnabled(false);
      // Encerra uma possível animação de ação e deixa o sprite em repouso.
      entry.renderer.currentState = null;
      entry.renderer.play('idle', now);
      return;
    }
    // Reposiciona o corpo uma única vez antes de reativar a física.
    entry.body.sync();
    entry.body.setEnabled(true);
    entry.renderer.setTransform(entry.entity.x, entry.entity.y);
  }
  damage(id, amount = 1, now = this.scene.time.now, penetration = 0) {
    const entry = this.entries.get(id);
    if (!entry || !entry.entity.alive) return { applied: 0, dead: false };
    const result = entry.entity.takeDamage(amount, penetration);
    if (!result.dead) {
      entry.renderer.play('attack', now);
      return result;
    }
    entry.body.setEnabled(false);
    entry.renderer.play('death', now);
    entry.removeAt = now + (Number(entry.entity.definition.deathDurationMs) || 600);
    this.spawner.notifyDeath(entry.entity.spawnZoneId, now);
    this.onKill({ monster: entry.entity, experience: entry.entity.definition.experience, drops: entry.entity.definition.drops });
    return result;
  }
  update(now, delta) {
    if (this.destroyed) return;
    this.spawner.update(now);
    const player = this.playerBody.player;
    for (const [id, entry] of this.entries) {
      if (entry.entity.dead) { if (now >= entry.removeAt) this.remove(id); continue; }

      const active = isWithinMonsterActivationRange(player, entry.entity);
      this.setEntryActive(entry, active, now);
      if (!active) continue;

      entry.behavior.update(entry.entity, now, delta);
      entry.body.sync();
      entry.renderer.setTransform(entry.entity.x, entry.entity.y);
      entry.renderer.update(now);
      entry.renderer.play(entry.entity.moving ? 'walking' : 'idle', now);
    }
  }
  remove(id) {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.collider?.destroy?.(); entry.body.destroy(); entry.renderer.destroy(); entry.behavior.destroy();
    this.entries.delete(id); return true;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const id of [...this.entries.keys()]) this.remove(id);
    this.spawner?.destroy(); this.factory?.destroy(); this.entries.clear();
    this.scene = null; this.navigation = null; this.playerBody = null; this.definitions = null; this.onKill = null;
  }
}