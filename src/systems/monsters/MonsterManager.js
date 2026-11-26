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
import MonsterBodyAdapter from '../../entities/MonsterBodyAdapter.js';
import MonsterBehaviorController from './MonsterBehaviorController.js';

export const PLAYER_ATTACK_RANGE_SQUARED = PLAYER_ATTACK_RANGE_WORLD_UNITS ** 2;
export const MONSTER_PURSUIT_DISTANCE_SQUARED = MONSTER_PURSUIT_DISTANCE_WORLD_UNITS ** 2;
export const MONSTER_IDLE_DISTANCE_SQUARED = MONSTER_IDLE_DISTANCE_WORLD_UNITS ** 2;
export const MONSTER_ACTIVATION_DISTANCE_SQUARED = MONSTER_ACTIVATION_DISTANCE_WORLD_UNITS ** 2;

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
  if (distanceSquared <= MONSTER_ACTIVATION_DISTANCE_SQUARED) return 'visual';
  return 'dormant';
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
    this.activationCheckIntervalMs = 250;
    this.nextActivationCheckAt = 0;
    this.activeEntries = new Set();
    this.visibilityCheckIntervalMs = 150;
    this.spawnerCheckIntervalMs = 500;
    this.nextSpawnerCheckAt = 0;
    this.nextVisibilityCheckAt = 0;
    this.visibilityPaddingFactor = 0.2;
    this.spawner = new MonsterSpawner({
      navigation, spawnZones, definitions,
      canSpawn: definition => definition?.spawnable !== false,
      createMonster: (definition, point, zone) => this.createMonster(definition, point, zone),
      getAlive: zoneId => this.getAliveInZone(zoneId),
      getPlayerPosition: () => ({ x: this.playerBody.player.x, y: this.playerBody.player.y }),
      isOccupied: (point, radius, zoneId) => this.isOccupied(point, radius, zoneId)
    });
    const initialNow = scene.time?.now || 0;
    this.spawner.update(initialNow);
    this.nextSpawnerCheckAt = initialNow + this.spawnerCheckIntervalMs;
  }
  createMonster(definition, point, zone) {
    const entry = this.factory.create(definition, point, zone);
    entry.collider = null;
    entry.mode = 'dormant';
    entry.nextRangeCheckAt = 0;
    this.entries.set(entry.entity.id, entry);
    return entry;
  }
  getAliveInZone(zoneId) {
    return [...this.entries.values()].filter(entry => entry.entity.alive && entry.entity.spawnZoneId === zoneId);
  }
  getAliveEntities() {
    return [...this.activeEntries].filter(entry => entry.entity.alive).map(entry => entry.entity);
  }
  getCombatEntries() {
    return [...this.activeEntries].filter(entry => entry.entity.alive && entry.mode === 'combat');
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

  updateVisibility(now) {
    if (now < this.nextVisibilityCheckAt) return;
    this.nextVisibilityCheckAt = now + this.visibilityCheckIntervalMs;
    const camera = this.scene?.cameras?.main;
    const view = camera?.worldView;
    if (!view || !Number.isFinite(view.x) || !Number.isFinite(view.y)) return;

    // Margem proporcional ao viewport evita alternância visual durante pan,
    // zoom e acompanhamento do jogador sem manter sprites distantes no draw.
    const padding = Math.max(view.width, view.height) * this.visibilityPaddingFactor;
    // Culling é exclusivamente visual: percorre também monstros dormentes,
    // sem criar corpo, IA, animação ou alterar o estado de ativação.
    for (const entry of this.entries.values()) {
      if (entry.entity.dead) continue;
      const frame = entry.renderer.frameBox || { width: 32, height: 32 };
      const visible = isMonsterInView(
        entry.entity.x, entry.entity.y, frame.width, frame.height, view, padding
      );
      entry.renderer.setInView(visible);
    }
  }

  activateEntry(entry) {
    if (entry.body && entry.behavior) return;
    entry.body = new MonsterBodyAdapter(this.scene, entry.entity, entry.entity.definition.collision);
    entry.behavior = new MonsterBehaviorController({
      navigation: this.navigation, zone: entry.zone, definition: entry.entity.definition
    });
  }

  setEntryMode(entry, mode, now) {
    entry.nextRangeCheckAt = now + this.rangeCheckIntervalMs;
    if (entry.mode === mode) return;
    const previousMode = entry.mode;
    entry.mode = mode;

    if (mode === 'dormant') {
      this.activeEntries.delete(entry);
      entry.behavior?.stop(entry.entity);
      entry.body?.setEnabled(false);
      entry.renderer.setShadowEnabled?.(false);
      // Ao adormecer, congela novamente na primeira arte estática.
      entry.renderer.currentState = null;
      entry.renderer.play('idle', now);
      return;
    }

    this.activateEntry(entry);
    this.activeEntries.add(entry);
    if (mode === 'idle' || mode === 'visual') {
      entry.renderer.setShadowEnabled?.(mode === 'idle');
      entry.behavior.stop(entry.entity);
      entry.body.setEnabled(false);
      if (previousMode === 'dormant' || previousMode === 'idle' || previousMode === 'visual') {
        entry.renderer.currentState = null;
        entry.renderer.play('idle', now);
      }
      return;
    }

    entry.renderer.setShadowEnabled?.(true);
    entry.body.setEnabled(true);
    entry.body.sync();
    entry.renderer.setTransform(entry.entity.x, entry.entity.y);
    if (mode === 'combat') entry.behavior.stop(entry.entity);
  }

  updateActivation(now) {
    if (now < this.nextActivationCheckAt) return;
    this.nextActivationCheckAt = now + this.activationCheckIntervalMs;
    const player = this.playerBody.player;
    // A varredura é apenas de coordenadas/estado no gerenciador; monstros
    // dormentes não recebem update, IA, física, renderer ou chamadas próprias.
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
    entry.body.setEnabled(false);
    entry.renderer.setShadowEnabled?.(false);
    entry.renderer.play('death', now);
    entry.removeAt = now + (Number(entry.entity.definition.deathDurationMs) || 600);
    this.spawner.notifyDeath(entry.entity.spawnZoneId, now);
    this.onKill({ monster: entry.entity, experience: entry.entity.definition.experience, drops: entry.entity.definition.drops });
    return result;
  }

  update(now, delta) {
    if (this.destroyed) return;
    if (now >= this.nextSpawnerCheckAt) {
      this.spawner.update(now);
      this.nextSpawnerCheckAt = now + this.spawnerCheckIntervalMs;
    }
    this.updateActivation(now);
    this.updateVisibility(now);
    const player = this.playerBody.player;
    for (const entry of [...this.activeEntries]) {
      const id = entry.entity.id;
      if (entry.entity.dead) { if (now >= entry.removeAt) this.remove(id); continue; }

      if (now >= entry.nextRangeCheckAt) {
        this.setEntryMode(entry, getMonsterBehaviorMode(player, entry.entity), now);
      }

      if (entry.mode === 'dormant' || entry.mode === 'visual') continue;

      entry.entity.update(delta, now);
      if (entry.mode === 'pursuit') {
        entry.behavior.pursue(entry.entity, player, delta);
      } else {
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
    entry.collider?.destroy?.(); entry.body?.destroy(); entry.renderer.destroy(); entry.behavior?.destroy();
    this.activeEntries.delete(entry);
    this.entries.delete(id); return true;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const id of [...this.entries.keys()]) this.remove(id);
    this.spawner?.destroy(); this.factory?.destroy(); this.entries.clear(); this.activeEntries.clear();
    this.scene = null; this.navigation = null; this.playerBody = null; this.definitions = null; this.onKill = null;
  }
}
