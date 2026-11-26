import {
  PLAYER_ATTACK_RANGE_WORLD_UNITS,
  MONSTER_PURSUIT_DISTANCE_WORLD_UNITS,
  MONSTER_IDLE_DISTANCE_WORLD_UNITS
} from '../../config.js';
import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';
import MonsterFactory from './MonsterFactory.js';
import MonsterSpawner from './MonsterSpawner.js';

export const PLAYER_ATTACK_RANGE_SQUARED = PLAYER_ATTACK_RANGE_WORLD_UNITS ** 2;
export const MONSTER_PURSUIT_DISTANCE_SQUARED = MONSTER_PURSUIT_DISTANCE_WORLD_UNITS ** 2;
export const MONSTER_IDLE_DISTANCE_SQUARED = MONSTER_IDLE_DISTANCE_WORLD_UNITS ** 2;

/** Retorna o nível de simulação sem calcular raiz quadrada. */
export function getMonsterBehaviorMode(player, monster) {
  if (!player || !monster || !Number.isFinite(player.x) || !Number.isFinite(player.y) ||
      !Number.isFinite(monster.x) || !Number.isFinite(monster.y)) return 'visual';
  const dx = monster.x - player.x;
  const dy = monster.y - player.y;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared <= PLAYER_ATTACK_RANGE_SQUARED) return 'combat';
  if (distanceSquared <= MONSTER_PURSUIT_DISTANCE_SQUARED) return 'pursuit';
  if (distanceSquared <= MONSTER_IDLE_DISTANCE_SQUARED) return 'idle';
  return 'visual';
}

export default class MonsterManager {
  constructor(scene, { navigation, playerBody, depthManager, spawnZones, definitions = MONSTER_DEFINITIONS, onKill = () => {} } = {}) {
    if (!scene || !navigation || !playerBody?.object || !Array.isArray(spawnZones)) {
      throw new TypeError('MonsterManager exige Scene, navegação, corpo do jogador e zonas.');
    }
    this.scene = scene; this.navigation = navigation; this.playerBody = playerBody;
    this.definitions = definitions; this.onKill = onKill; this.entries = new Map();
    this.factory = new MonsterFactory(scene, { navigation, depthManager }); this.destroyed = false;
    this.rangeCheckIntervalMs = 100;
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
    entry.mode = null;
    entry.nextRangeCheckAt = 0;
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

  setEntryMode(entry, mode, now) {
    // Reagenda sempre, inclusive quando a faixa nao mudou.
    entry.nextRangeCheckAt = now + this.rangeCheckIntervalMs;
    if (entry.mode === mode) return;
    const previousMode = entry.mode;
    entry.mode = mode;

    if (mode === 'idle' || mode === 'visual') {
      entry.behavior.stop(entry.entity);
      entry.body.setEnabled(false);
      // Um único frame de repouso; em visual-only o renderer não recebe updates.
      if (previousMode !== 'visual') {
        entry.renderer.currentState = null;
        entry.renderer.play('idle', now);
      }
      return;
    }

    // Corpo físico só fica habilitado nas faixas de combate/perseguição.
    entry.body.setEnabled(true);
    entry.body.sync();
    entry.renderer.setTransform(entry.entity.x, entry.entity.y);
    if (mode === 'combat') entry.behavior.stop(entry.entity);
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

      // Entidades paradas verificam mudança de faixa a cada 100 ms, não a cada frame.
      if (now >= entry.nextRangeCheckAt) {
        this.setEntryMode(entry, getMonsterBehaviorMode(player, entry.entity), now);
      }

      if (entry.mode === 'visual') continue;

      if (entry.mode === 'idle') {
        // Mantém apenas o repouso visual; sem IA, física ou sincronização.
        entry.renderer.update(now);
        entry.renderer.play('idle', now);
        continue;
      }

      if (entry.mode === 'pursuit') {
        entry.behavior.pursue(entry.entity, player, delta);
      } else {
        // Dentro de 2 m, o sistema de combate do jogador executa os ataques.
        entry.behavior.stop(entry.entity);
      }

      if (entry.entity.moving) {
        entry.body.sync();
        entry.renderer.setTransform(entry.entity.x, entry.entity.y);
      }
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