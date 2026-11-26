import test from 'node:test';
import assert from 'node:assert/strict';
import Monster from '../src/entities/Monster.js';
import MonsterSpawner from '../src/systems/monsters/MonsterSpawner.js';
import { MONSTER_DEFINITIONS } from '../src/data/monsters/index.js';
import { ISLAND_01_MONSTER_SPAWNS } from '../src/world/spawn-layout/island-01.js';
const definition = { id: 'test-monster', maxHealth: 2, speed: 20, defense: 0, collision: { radius: 8 }, behavior: { moveChance: 1, decisionMinMs: 500, decisionMaxMs: 500 } };
test('Monster mantém estado lógico, recebe dano e morre sem dependência de Phaser', () => {
  const monster = new Monster({ id: 'test-1', speciesId: 'test-monster', x: 10, y: 20, definition, spawnZoneId: 'test-zone' });
  assert.equal(monster.alive, true);
  assert.deepEqual(monster.takeDamage(1), { applied: 1, health: 1, dead: false });
  assert.deepEqual(monster.takeDamage(1), { applied: 1, health: 0, dead: true });
  assert.equal(monster.moving, false);
  assert.deepEqual(monster.takeDamage(1), { applied: 0, health: 0, dead: true });
});
test('Monster restaura vida e estado sem alterar sua definição', () => {
  const monster = new Monster({ id: 'test-2', speciesId: 'test-monster', x: 10, y: 20, definition, spawnZoneId: 'test-zone' });
  monster.takeDamage(2); monster.restore();
  assert.equal(monster.health, 2); assert.equal(monster.alive, true);
  assert.deepEqual(monster.facing, { x: 0, y: 1 });
});
test('slime usa os quatro WebP finais já existentes no repositório', () => {
  const slime = MONSTER_DEFINITIONS.slime;
  assert.ok(slime); assert.equal(slime.visual.enabled, true);
  assert.deepEqual(Object.keys(slime.visual.animations), ['idle', 'walking', 'attack', 'death']);
  assert.deepEqual(Object.values(slime.visual.animations).map(pack => pack.path), [
    'assets/monsters/slime/parado_01.webp',
    'assets/monsters/slime/slime_movimento_frame_02_webp.webp',
    'assets/monsters/slime/slime_ataque_frame_02(1).webp',
    'assets/monsters/slime/slime_morte_frame_02.webp'
  ]);
  assert.deepEqual(slime.drops, []);
});
test('ilha usa um único limite global de 50 slimes com surgimento em toda a área', () => {
  assert.equal(ISLAND_01_MONSTER_SPAWNS.length, 1);
  const [zone] = ISLAND_01_MONSTER_SPAWNS;
  assert.equal(zone.id, 'slime-island');
  assert.equal(zone.x, 2048);
  assert.equal(zone.y, 2048);
  assert.equal(zone.radius, 2010);
  assert.equal(zone.maxAlive, 50);
  assert.equal(zone.minPlayerDistance, 0);
  assert.equal(zone.respawnMs, 1000);
  assert.equal(zone.spawnIntervalMs, 1000);
  assert.equal(zone.retryMs, 1000);
});

test('Spawner cria no máximo um slime por segundo até atingir 50 vivos', () => {
  const alive = [];
  const created = [];
  const zone = ISLAND_01_MONSTER_SPAWNS[0];
  const spawner = new MonsterSpawner({
    navigation: { isAreaWalkable: () => true },
    spawnZones: [zone],
    definitions: { slime: definition },
    canSpawn: () => true,
    createMonster: (monsterDefinition, point, spawnZone) => {
      const entry = { definition: monsterDefinition, point, zoneId: spawnZone.id };
      alive.push(entry); created.push(entry); return entry;
    },
    getAlive: zoneId => alive.filter(entry => entry.zoneId === zoneId),
    getPlayerPosition: () => ({ x: 2048, y: 2048 }),
    isOccupied: () => false,
    random: () => 0.5
  });
  spawner.update(0);
  assert.equal(created.length, 1);
  spawner.update(999);
  assert.equal(created.length, 1);
  spawner.update(1000);
  assert.equal(created.length, 2);
  for (let now = 2000; now <= 49000; now += 1000) spawner.update(now);
  assert.equal(created.length, 50);
  spawner.update(50000);
  assert.equal(created.length, 50);
});

test('Spawner respeita população máxima e agenda respawn após morte', () => {
  const alive = []; const created = [];
  const zone = { id: 'test-zone', speciesId: 'test-monster', x: 200, y: 200, radius: 40, maxAlive: 2, minPlayerDistance: 0, respawnMs: 100, retryMs: 20, enabled: true };
  const spawner = new MonsterSpawner({
    navigation: { isAreaWalkable: () => true }, spawnZones: [zone], definitions: { 'test-monster': definition }, canSpawn: () => true,
    createMonster: (monsterDefinition, point, spawnZone) => { const entry = { definition: monsterDefinition, point, zoneId: spawnZone.id }; alive.push(entry); created.push(entry); return entry; },
    getAlive: zoneId => alive.filter(entry => entry.zoneId === zoneId), getPlayerPosition: () => ({ x: 0, y: 0 }), isOccupied: () => false, random: () => 0.5
  });
  spawner.update(0); assert.equal(created.length, 2); spawner.update(1); assert.equal(created.length, 2);
  alive.shift(); spawner.notifyDeath('test-zone', 10);
  spawner.update(109); assert.equal(alive.length, 1); assert.equal(created.length, 2);
  spawner.update(110); assert.equal(alive.length, 2); assert.equal(created.length, 3);
});
test('Spawner não cria monstro sobre área bloqueada e agenda nova tentativa', () => {
  let attempts = 0;
  const spawner = new MonsterSpawner({
    navigation: { isAreaWalkable: () => false },
    spawnZones: [{ id: 'blocked', speciesId: 'test-monster', x: 100, y: 100, radius: 20, maxAlive: 1, retryMs: 50 }],
    definitions: { 'test-monster': definition }, canSpawn: () => true,
    createMonster: () => { attempts += 1; return true; }, random: () => 0.5
  });
  spawner.update(0); spawner.update(49); assert.equal(attempts, 0); spawner.update(50); assert.equal(attempts, 0);
});
