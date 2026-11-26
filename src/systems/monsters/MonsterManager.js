import {
  PLAYER_ATTACK_RANGE_WORLD_UNITS,
  MONSTER_PURSUIT_DISTANCE_WORLD_UNITS,
  MONSTER_IDLE_DISTANCE_WORLD_UNITS,
  MONSTER_ACTIVATION_DISTANCE_WORLD_UNITS
} from '../../config.js';
import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';
import { isMonsterInView } from '../../rendering/monsters/MonsterRenderer.js';
import MonsterFactory from './MonsterFactory.js';
import MonsterSpawner from './MonsterSpawner.js';
import MonsterBehaviorController from './MonsterBehaviorController.js';

export const PLAYER_ATTACK_RANGE_SQUARED = PLAYER_ATTACK_RANGE_WORLD_UNITS ** 2;
export const MONSTER_PURSUIT_DISTANCE_SQUARED = MONSTER_PURSUIT_DISTANCE_WORLD_UNITS ** 2;
export const MONSTER_IDLE_DISTANCE_SQUARED = MONSTER_IDLE_DISTANCE_WORLD_UNITS ** 2;
export const MONSTER_ACTIVATION_DISTANCE_SQUARED = MONSTER_ACTIVATION_DISTANCE_WORLD_UNITS ** 2;
const AI_TICK_MS = 33;

export function getMonsterBehaviorMode(player, monster) {
  if (!player || !monster || !Number.isFinite(player.x) || !Number.isFinite(player.y) ||
      !Number.isFinite(monster.x) || !Number.isFinite(monster.y)) return 'visual';
  const dx = monster.x - player.x;
  const dy = monster.y - player.y;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared <= PLAYER_ATTACK_RANGE_SQUARED) return 'combat';
  if (distanceSquared <= MONSTER_PURSUIT_DISTANCE_SQUARED) return 'pursuit';
  if (distanceSquared <= MONSTER_IDLE_DISTANCE_SQUARED) return 'idle';
  if (distanceSquared <= MONSTER_ACTIVATION_DISTANCE_SQUARED) return 'visual';
  return 'dormant';
}

function stablePhase(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % AI_TICK_MS;
}

export default class MonsterManager {
  constructor(scene, { navigation, playerBody, depthManager, spawnZones,
    definitions = MONSTER_DEFINITIONS, onKill = () => {} } = {}) {
    if (!scene || !navigation || !playerBody?.object || !Array.isArray(spawnZones)) {
      throw new TypeError('MonsterManager exige Scene, navegação, corpo do jogador e zonas.');
    }
    this.scene = scene;
    this.navigation = navigation;
    this.playerBody = playerBody;
    this.definitions = definitions;
    this.onKill = onKill;
    this.entries = new Map();
    this.factory = new MonsterFactory(scene, { depthManager });
    this.destroyed = false;

    // Coleções estáveis: consultas de combate não alocam arrays/sets por frame.
    this.activeEntries = new Set();
    this.combatEntries = new Set();
    this.targetEntities = [];
    this.activationCheckIntervalMs = 250;
    this.nextActivationCheckAt = 0;
    this.visibilityCheckIntervalMs = 150;
    this.spawnerCheckIntervalMs = 500;
    this.nextSpawnerCheckAt = 0;
    this.nextVisibilityCheckAt = 0;
    this.visibilityPaddingFactor = 0.2;
    this.metrics = {
      totalMs: 0, activationMs: 0, visibilityMs: 0, spawnMs: 0,
      simulationMs: 0, alive: 0, visible: 0, active: 0, pursuing: 0, combat: 0
    };

    this.spawner = new MonsterSpawner({
      navigation, spawnZones, definitions,
      canSpawn: definition => definition?.spawnable !== false,
      createMonster: (definition, point, zone) => this.createMonster(definition, point, zone),
      getAliveCount: zoneId => this.countAliveInZone(zoneId),
      getPlayerPosition: () => this.playerBody.player,
      isOccupied: (point, radius, zoneId) => this.isOccupied(point, radius, zoneId)
    });
    const initialNow = scene.time?.now || 0;
    this.spawner.update(initialNow);
    this.nextSpawnerCheckAt = initialNow + this.spawnerCheckIntervalMs;
  }

  createMonster(definition, point, zone) {
    const entry = this.factory.create(definition, point, zone);
    this.entries.set(entry.entity.id, entry);
    return entry;
  }

  countAliveInZone(zoneId) {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.entity.alive && entry.entity.spawnZoneId === zoneId) count++;
    }
    return count;
  }

  getAliveInZone(zoneId) {
    const result = [];
    for (const entry of this.entries.values()) {
      if (entry.entity.alive && entry.entity.spawnZoneId === zoneId) result.push(entry);
    }
    return result;
  }

  getAliveEntities() { return this.targetEntities; }
  getCombatEntries() { return this.combatEntries; }

  updateTargetMembership(entry, include) {
    const index = this.targetEntities.indexOf(entry.entity);
    if (include && index === -1) this.targetEntities.push(entry.entity);
    else if (!include && index !== -1) this.targetEntities.splice(index, 1);
  }

  isOccupied(point, radius, zoneId) {
    for (const entry of this.entries.values()) {
      if (!entry.entity.alive || entry.entity.spawnZoneId !== zoneId) continue;
      const otherRadius = Number(entry.entity.definition.collision?.radius) || 12;
      const minDistance = radius + otherRadius + 12;
      const dx = point.x - entry.entity.x;
      const dy = point.y - entry.entity.y;
      if (dx * dx + dy * dy < minDistance * minDistance) return true;
    }
    return false;
  }

  isAlive(id) { return Boolean(this.entries.get(id)?.entity.alive); }

  updateVisibility(now) {
    if (now < this.nextVisibilityCheckAt) return;
    this.nextVisibilityCheckAt = now + this.visibilityCheckIntervalMs;
    const view = this.scene?.cameras?.main?.worldView;
    if (!view || !Number.isFinite(view.x) || !Number.isFinite(view.y)) return;
    const padding = Math.max(view.width, view.height) * this.visibilityPaddingFactor;
    let visibleCount = 0;
    for (const entry of this.entries.values()) {
      if (entry.entity.dead) continue;
      const frame = entry.renderer.frameBox || { width: 32, height: 32 };
      const visible = isMonsterInView(entry.entity.x, entry.entity.y, frame.width, frame.height, view, padding);
      entry.renderer.setInView(visible);
      if (visible) visibleCount++;
    }
    this.metrics.visible = visibleCount;
  }

  setEntryMode(entry, mode, now) {
    if (entry.mode === mode) return;
    const previousMode = entry.mode;
    entry.mode = mode;
    const active = mode === 'pursuit' || mode === 'combat';
    if (active) this.activeEntries.add(entry);
    else this.activeEntries.delete(entry);
    if (mode === 'combat') this.combatEntries.add(entry);
    else this.combatEntries.delete(entry);
    this.updateTargetMembership(entry, active);

    if (previousMode === 'pursuit' && mode !== 'pursuit') {
      entry.behavior?.destroy();
      entry.behavior = null;
    }

    if (mode === 'pursuit') {
      if (!entry.behavior) {
        entry.behavior = new MonsterBehaviorController({
          navigation: this.navigation, zone: entry.zone, definition: entry.entity.definition
        });
      }
      entry.nextSimulationAt = now + stablePhase(entry.entity.id);
      entry.lastSimulationAt = now;
      entry.lastMoving = false;
      entry.renderer.setShadowEnabled(true);
      entry.renderer.play('idle', now);
      return;
    }

    if (mode === 'combat') {
      entry.entity.setMoving(false);
      entry.lastMoving = false;
      entry.renderer.setShadowEnabled(true);
      entry.renderer.play('idle', now);
      return;
    }

    // Idle, visual e dormant são somente apresentação estática.
    // Não criam corpo Arcade, controlador de IA ou ciclo de update.
    entry.entity.setMoving(false);
    entry.lastMoving = false;
    entry.renderer.setShadowEnabled(false);
    entry.renderer.play('idle', now);
  }

  updateActivation(now) {
    if (now < this.nextActivationCheckAt) return;
    this.nextActivationCheckAt = now + this.activationCheckIntervalMs;
    const player = this.playerBody.player;
    for (const entry of this.entries.values()) {
      if (entry.entity.dead) continue;
      const mode = getMonsterBehaviorMode(player, entry.entity);
      if (mode !== entry.mode) this.setEntryMode(entry, mode, now);
    }
  }

  damage(id, amount = 1, now = this.scene.time.now, penetration = 0) {
    const entry = this.entries.get(id);
    if (!entry || !entry.entity.alive || entry.mode === 'dormant') return { applied: 0, dead: false };
    const result = entry.entity.takeDamage(amount, penetration, now);
    if (!result.dead) {
      entry.renderer.play('attack', now);
      return result;
    }
    // Mantém na coleção ativa até o fim da janela de morte para que a entrada
    // seja destruída no prazo correto; sai imediatamente das coleções de alvo.
    this.activeEntries.add(entry);
    this.combatEntries.delete(entry);
    this.updateTargetMembership(entry, false);
    entry.renderer.setShadowEnabled(false);
    entry.renderer.play('death', now);
    entry.removeAt = now + (Number(entry.entity.definition.deathDurationMs) || 600);
    this.spawner.notifyDeath(entry.entity.spawnZoneId, now);
    this.onKill({
      monster: entry.entity,
      experience: entry.entity.definition.experience,
      drops: entry.entity.definition.drops
    });
    return result;
  }

  update(now, delta) {
    if (this.destroyed) return;
    this.metrics ||= {};
    const started = performance.now();
    let phase = performance.now();

    if (now >= this.nextSpawnerCheckAt) {
      this.spawner.update(now);
      this.nextSpawnerCheckAt = now + this.spawnerCheckIntervalMs;
    }
    this.metrics.spawnMs = performance.now() - phase;

    phase = performance.now();
    this.updateActivation(now);
    this.metrics.activationMs = performance.now() - phase;

    phase = performance.now();
    this.updateVisibility(now);
    this.metrics.visibilityMs = performance.now() - phase;

    phase = performance.now();
    for (const entry of this.activeEntries) {
      const entity = entry.entity;
      if (entity.dead) {
        if (now >= entry.removeAt) this.remove(entity.id);
        continue;
      }
      entity.update(delta, now);
      if (entry.mode !== 'pursuit' || now < entry.nextSimulationAt) {
        if (entry.renderer.update(now)) entry.renderer.play('idle', now);
        continue;
      }

      const elapsed = Math.min(50, Math.max(0, now - entry.lastSimulationAt));
      entry.lastSimulationAt = now;
      entry.nextSimulationAt = now + AI_TICK_MS;
      const moved = entry.behavior.pursue(entity, this.playerBody.player, elapsed);
      if (moved) entry.renderer.setTransform(entity.x, entity.y);
      if (entity.moving !== entry.lastMoving) {
        entry.lastMoving = entity.moving;
        entry.renderer.play(entity.moving ? 'walking' : 'idle', now);
      }
      if (entry.renderer.update(now)) entry.renderer.play(entity.moving ? 'walking' : 'idle', now);
    }
    this.metrics.simulationMs = performance.now() - phase;
    this.metrics.totalMs = performance.now() - started;
    this.metrics.alive = this.entries.size;
    this.metrics.active = this.activeEntries.size;
    this.metrics.combat = this.combatEntries.size;
    this.metrics.pursuing = this.activeEntries.size - this.combatEntries.size;
  }

  remove(id) {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.behavior?.destroy();
    entry.renderer.destroy();
    this.activeEntries.delete(entry);
    this.combatEntries.delete(entry);
    this.updateTargetMembership(entry, false);
    this.entries.delete(id);
    return true;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const id of [...this.entries.keys()]) this.remove(id);
    this.spawner?.destroy();
    this.factory?.destroy();
    this.entries.clear();
    this.activeEntries.clear();
    this.combatEntries.clear();
    this.targetEntities.length = 0;
    this.scene = null;
    this.navigation = null;
    this.playerBody = null;
    this.definitions = null;
    this.onKill = null;
  }
}
