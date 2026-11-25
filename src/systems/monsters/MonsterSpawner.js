/**
 * Spawner orientado a zonas. Só cria entidades quando a definição visual
 * está habilitada e o atlas de repouso foi carregado e validado.
 */
export default class MonsterSpawner {
  constructor({
    navigation,
    spawnZones,
    definitions,
    canSpawn,
    createMonster,
    getAlive,
    getPlayerPosition,
    isOccupied,
    random = Math.random
  }) {
    if (!navigation || !Array.isArray(spawnZones) || !definitions || !createMonster) {
      throw new TypeError('MonsterSpawner recebeu configuração incompleta.');
    }

    this.navigation = navigation;
    this.zones = spawnZones.map(zone => ({ ...zone, nextSpawnAt: 0 }));
    this.definitions = definitions;
    this.canSpawn = canSpawn || (() => false);
    this.createMonster = createMonster;
    this.getAlive = getAlive || (() => []);
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
      let aliveCount = this.getAlive(zone.id).length;
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

        aliveCount += 1;
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

    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = this.random() * Math.PI * 2;
      const distance = Math.sqrt(this.random()) * radius;
      const point = {
        x: zone.x + Math.cos(angle) * distance,
        y: zone.y + Math.sin(angle) * distance
      };

      if (!this.navigation.isAreaWalkable(point.x, point.y, collisionRadius)) continue;
      if (player && Number.isFinite(zone.minPlayerDistance)) {
        if (Math.hypot(point.x - player.x, point.y - player.y) < zone.minPlayerDistance) continue;
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
    this.getPlayerPosition = null;
    this.isOccupied = null;
  }
}
