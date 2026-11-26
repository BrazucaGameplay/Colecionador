/**
 * Spawner por zonas. Conta a população sem materializar arrays temporários.
 */
export default class MonsterSpawner {
  constructor({ navigation, spawnZones, definitions, canSpawn, createMonster,
    getAlive, getAliveCount, getPlayerPosition, isOccupied, random = Math.random }) {
    if (!navigation || !Array.isArray(spawnZones) || !definitions || !createMonster) {
      throw new TypeError('MonsterSpawner recebeu configuração incompleta.');
    }
    this.navigation = navigation;
    this.zones = spawnZones.map(zone => ({ ...zone, nextSpawnAt: 0 }));
    this.definitions = definitions;
    this.canSpawn = canSpawn || (() => false);
    this.createMonster = createMonster;
    this.getAlive = getAlive || (() => []);
    this.getAliveCount = getAliveCount || (zoneId => this.getAlive(zoneId).length);
    this.getPlayerPosition = getPlayerPosition || (() => null);
    this.isOccupied = isOccupied || (() => false);
    this.random = random;
    this.destroyed = false;
  }

  update(now) {
    if (this.destroyed) return;
    for (const zone of this.zones) {
      if (zone.enabled === false || now < zone.nextSpawnAt) continue;
      const definition = this.definitions[zone.speciesId];
      if (!definition || !this.canSpawn(definition)) continue;
      const maxAlive = Math.max(0, Math.floor(Number(zone.maxAlive) || 0));
      let aliveCount = this.getAliveCount(zone.id);
      while (aliveCount < maxAlive) {
        const point = this.findSpawnPoint(zone, definition);
        if (!point) {
          zone.nextSpawnAt = now + (zone.retryMs || 2500);
          break;
        }
        const created = this.createMonster(definition, point, zone);
        if (!created) {
          zone.nextSpawnAt = now + (zone.retryMs || 2500);
          break;
        }
        aliveCount++;
        if (zone.spawnIntervalMs > 0) {
          zone.nextSpawnAt = now + zone.spawnIntervalMs;
          break;
        }
      }
    }
  }

  findSpawnPoint(zone, definition) {
    const radius = Math.max(0, Number(zone.radius) || 0);
    const collisionRadius = Number(definition.collision?.radius) || 12;
    const player = this.getPlayerPosition();
    const minPlayerDistanceSquared = Number.isFinite(zone.minPlayerDistance)
      ? zone.minPlayerDistance * zone.minPlayerDistance : -1;
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = this.random() * Math.PI * 2;
      const distance = Math.sqrt(this.random()) * radius;
      const point = {
        x: zone.x + Math.cos(angle) * distance,
        y: zone.y + Math.sin(angle) * distance
      };
      if (!this.navigation.isAreaWalkable(point.x, point.y, collisionRadius)) continue;
      if (player && minPlayerDistanceSquared >= 0) {
        const dx = point.x - player.x;
        const dy = point.y - player.y;
        if (dx * dx + dy * dy < minPlayerDistanceSquared) continue;
      }
      if (this.isOccupied(point, collisionRadius, zone.id)) continue;
      return point;
    }
    return null;
  }

  notifyDeath(zoneId, now) {
    const zone = this.zones.find(item => item.id === zoneId);
    if (!zone) return false;
    zone.nextSpawnAt = now + Math.max(0, Number(zone.respawnMs) || 0);
    return true;
  }

  destroy() {
    this.destroyed = true;
    this.zones.length = 0;
    this.navigation = null;
    this.definitions = null;
    this.createMonster = null;
    this.getAlive = null;
    this.getAliveCount = null;
    this.getPlayerPosition = null;
    this.isOccupied = null;
  }
}
