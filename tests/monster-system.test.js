import test from 'node:test';
import assert from 'node:assert/strict';
import Monster from '../src/entities/Monster.js';
import MonsterSpawner from '../src/systems/monsters/MonsterSpawner.js';
import { PLAYER_ATTACK_RANGE_METERS, PLAYER_ATTACK_RANGE_WORLD_UNITS, WORLD_UNITS_PER_METER, MONSTER_PURSUIT_DISTANCE_METERS, MONSTER_IDLE_DISTANCE_METERS, MONSTER_PURSUIT_DISTANCE_WORLD_UNITS, MONSTER_IDLE_DISTANCE_WORLD_UNITS } from '../src/config.js';
import { getMonsterBehaviorMode } from '../src/systems/monsters/MonsterManager.js';
import MonsterBehaviorController from '../src/systems/monsters/MonsterBehaviorController.js';
import CombatSystem from '../src/systems/CombatSystem.js';
import { MONSTER_DEFINITIONS } from '../src/data/monsters/index.js';
import { ISLAND_01_MONSTER_SPAWNS } from '../src/world/spawn-layout/island-01.js';
const definition = { id: 'test-monster', maxHealth: 2, speed: 20, defense: 0, collision: { radius: 8 }, behavior: { moveChance: 1, decisionMinMs: 500, decisionMaxMs: 500 } };
test('Monster mantém estado lógico, recebe dano e morre sem dependência de Phaser', () => {
  const monster = new Monster({ id: 'test-1', speciesId: 'test-monster', x: 10, y: 20, definition, spawnZoneId: 'test-zone' });
  assert.equal(monster.alive, true);
  assert.deepEqual(monster.takeDamage(1, 1), { applied: 1, health: 0, dead: true });
  assert.equal(monster.moving, false);
  assert.deepEqual(monster.takeDamage(1, 1), { applied: 0, health: 0, dead: true });
});
test('Monster restaura vida e estado sem alterar sua definição', () => {
  const monster = new Monster({ id: 'test-2', speciesId: 'test-monster', x: 10, y: 20, definition, spawnZoneId: 'test-zone' });
  monster.takeDamage(2); monster.restore();
  assert.equal(monster.health, 1); assert.equal(monster.alive, true);
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
  assert.deepEqual(slime.stats, {
    attack: 1, defense: 1, penetration: 1, attackSpeed: 1,
    movementSpeed: 1, maxHealth: 1, maxEnergy: 1,
    healthRegen: 1, energyRegen: 1
  });
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

test('escala fixa: ataque 2 m, perseguição 10 m e ociosidade até 30 m', () => {
  assert.equal(WORLD_UNITS_PER_METER, 75);
  assert.equal(PLAYER_ATTACK_RANGE_METERS, 2);
  assert.equal(PLAYER_ATTACK_RANGE_WORLD_UNITS, 150);
  assert.equal(MONSTER_PURSUIT_DISTANCE_METERS, 10);
  assert.equal(MONSTER_IDLE_DISTANCE_METERS, 30);
  assert.equal(MONSTER_PURSUIT_DISTANCE_WORLD_UNITS, 750);
  assert.equal(MONSTER_IDLE_DISTANCE_WORLD_UNITS, 2250);
});

test('faixas de distância aplicam combate, perseguição, ociosidade e visual-only nos limites exatos', () => {
  const player = { x: 100, y: 200 };
  const modeAt = distance => getMonsterBehaviorMode(player, { x: player.x + distance, y: player.y });
  assert.equal(modeAt(0), 'combat');
  assert.equal(modeAt(150), 'combat');
  assert.equal(modeAt(150.01), 'pursuit');
  assert.equal(modeAt(750), 'pursuit');
  assert.equal(modeAt(750.01), 'idle');
  assert.equal(modeAt(2250), 'idle');
  assert.equal(modeAt(2250.01), 'visual');
});

test('perseguição move o monstro na direção do jogador e respeita navegação', () => {
  const monster = new Monster({ id: 'chaser', speciesId: 'test-monster', x: 100, y: 100, definition, spawnZoneId: 'test-zone' });
  const behavior = new MonsterBehaviorController({
    navigation: { isAreaWalkable: () => true },
    zone: { x: 100, y: 100, radius: 1000 },
    definition,
    random: () => 0
  });
  assert.equal(behavior.pursue(monster, { x: 200, y: 100 }, 50), true);
  assert.ok(monster.x > 100);
  assert.equal(monster.y, 100);
  assert.equal(monster.moving, true);
  behavior.stop(monster);
  assert.equal(monster.moving, false);
});


test('CombatSystem ataca somente dentro de 2 m e detecta alvos ate 10 m', () => {
  const player = {
    x: 0, y: 0, alive: true, stats: { attackSpeed: 1, penetration: 0 },
    setFacing() {}, setMoving() {}, markCombat() {},
    getAttackDamage: () => 5
  };
  const movement = {
    hasManualDestination: false,
    stopped: false,
    destination: null,
    stopAutomaticMovement() { this.stopped = true; },
    setAutomaticDestination(x, y) { this.destination = { x, y }; }
  };
  const target = { id: 'target', x: 150, y: 0, alive: true, defense: 0 };
  let attacks = 0;
  const combat = new CombatSystem({
    player, movement, getTargets: () => [target],
    onAttack: () => { attacks += 1; }
  });
  assert.equal(combat.attackRange, 150);
  assert.equal(combat.detectionRange, 750);
  combat.update(0);
  assert.equal(attacks, 1);

  target.x = 151;
  combat.targetId = null;
  combat.nextRetargetAt = 0;
  combat.update(300);
  assert.equal(attacks, 1);
  assert.deepEqual(movement.destination, { x: 151, y: 0 });

  target.x = 750;
  assert.equal(combat.selectTarget(), target);
  target.x = 750.01;
  assert.equal(combat.selectTarget(), null);
  combat.destroy();
});


import Player from '../src/entities/Player.js';
import MonsterCombatSystem from '../src/systems/monsters/MonsterCombatSystem.js';

test('monstros recebem cópia independente do mesmo esquema de status do jogador, todos em 1', () => {
  const monster = new Monster({ id: 'stats-1', speciesId: 'test-monster', x: 0, y: 0, definition, spawnZoneId: 'test-zone' });
  assert.deepEqual(monster.stats, {
    attack: 1, defense: 1, penetration: 1, attackSpeed: 1,
    movementSpeed: 1, maxHealth: 1, maxEnergy: 1,
    healthRegen: 1, energyRegen: 1
  });
  assert.equal(monster.maxHealth, 1);
  assert.equal(monster.health, 1);
  const player = new Player({ x: 0, y: 0 });
  assert.notEqual(monster.stats, player.stats);
  assert.equal(player.stats.attack, 5);
});

test('MonsterCombatSystem ataca a 2 m, respeita cooldown de 1 ataque/s e usa penetração', () => {
  const player = new Player({ x: 0, y: 0 });
  const monster = new Monster({ id: 'attacker-1', speciesId: 'test-monster', x: 150, y: 0, definition, spawnZoneId: 'test-zone' });
  const entry = { entity: monster, mode: 'combat', renderer: { playCalls: 0, play() { this.playCalls += 1; } } };
  const combat = new MonsterCombatSystem({ player, getAttackers: () => [entry] });

  combat.update(0);
  assert.equal(player.health, 99);
  assert.equal(entry.renderer.playCalls, 1);
  combat.update(999);
  assert.equal(player.health, 99);
  combat.update(1000);
  assert.equal(player.health, 98);
  assert.equal(entry.renderer.playCalls, 2);

  monster.x = 151;
  combat.update(2000);
  assert.equal(player.health, 98);
  combat.destroy();
});

test('dano recebido pelo jogador considera penetração sem alterar os status do atacante', () => {
  const player = new Player({ x: 0, y: 0, saveData: { stats: { defense: 2 } } });
  const blocked = player.takeDamage(1, 0, 1);
  assert.equal(blocked.applied, 0);
  const penetrated = player.takeDamage(2, 10, 1);
  assert.equal(penetrated.applied, 1);
  assert.equal(player.health, 99);
  assert.equal(player.stats.defense, 2);
});


test('CombatSystem envia ataque base para a entidade resolver defesa uma única vez', () => {
  const player = {
    x: 0, y: 0, alive: true, stats: { attack: 5, attackSpeed: 1, penetration: 1 },
    setFacing() {}, setMoving() {}, markCombat() {},
    getAttackDamage: () => 999
  };
  const movement = {
    hasManualDestination: false,
    stopAutomaticMovement() {},
    setAutomaticDestination() {}
  };
  const target = { id: 'defender', x: 10, y: 0, alive: true, defense: 3 };
  let received;
  const combat = new CombatSystem({
    player, movement, getTargets: () => [target],
    onAttack: (_target, amount, _now, penetration) => { received = { amount, penetration }; }
  });
  combat.update(0);
  assert.deepEqual(received, { amount: 5, penetration: 1 });
  combat.destroy();
});
