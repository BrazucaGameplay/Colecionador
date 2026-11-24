import test from 'node:test';
import assert from 'node:assert/strict';
import Monster from '../src/entities/Monster.js';
import MonsterBehaviorSystem from '../src/systems/MonsterBehaviorSystem.js';
import CombatSystem from '../src/systems/CombatSystem.js';
import { MONSTER_CONFIG } from '../src/config/MonsterConfig.js';

function createMonsterScene() {
  const sprite = {
    visible: true,
    velocity: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    setCollideWorldBounds() { return this; },
    setVisible(value) { this.visible = value; return this; },
    setVelocity(x, y) { this.velocity = { x, y }; return this; },
    setPosition(x, y) { this.position = { x, y }; return this; },
    destroy() { this.destroyed = true; }
  };
  return {
    sprite,
    physics: { add: { sprite() { return sprite; } } },
    tweens: { add() {} }
  };
}

test('Monster entity uses configured prototype health and owns its life cycle', () => {
  const scene = createMonsterScene();
  const monster = new Monster(scene, 120, 80, MONSTER_CONFIG.prototype);

  assert.equal(monster.hp, 2);
  assert.equal(monster.takeHit(1), true);
  assert.equal(monster.hp, 1);
  assert.equal(monster.takeHit(1), true);
  assert.equal(monster.dead, true);
  assert.equal(scene.sprite.visible, false);

  monster.respawn();
  assert.equal(monster.hp, 2);
  assert.equal(monster.dead, false);
  assert.deepEqual(scene.sprite.position, { x: 120, y: 80 });
  assert.deepEqual(scene.sprite.velocity, { x: 0, y: 0 });
});

test('MonsterBehaviorSystem moves multiple monsters without embedding AI in entities', () => {
  const velocities = [];
  const first = { dead: false, sprite: { setVelocity(x, y) { velocities.push({ x, y }); } } };
  const second = { dead: false, sprite: { setVelocity(x, y) { velocities.push({ x, y }); } } };
  const system = new MonsterBehaviorSystem({
    monsters: [first, second],
    config: MONSTER_CONFIG.prototype,
    random: () => 0.25
  });

  system.update(0);
  assert.equal(velocities.length, 2);
  assert.ok(Math.abs(velocities[0].x) < 1e-10);
  assert.equal(Math.round(velocities[0].y), 60);

  system.update(500);
  assert.equal(velocities.length, 2);
  system.update(1000);
  assert.equal(velocities.length, 4);

  system.destroy();
  assert.equal(system.monsters.length, 0);
});

test('MonsterBehaviorSystem can add and remove entities safely', () => {
  const system = new MonsterBehaviorSystem({ monsters: [] });
  const monster = { dead: false, sprite: { setVelocity() {} } };

  assert.equal(system.add(monster), true);
  assert.equal(system.add(monster), false);
  assert.equal(system.remove(monster), true);
  assert.equal(system.remove(monster), false);
});

test('CombatSystem applies configured damage rather than embedding damage in Monster', () => {
  const combat = new CombatSystem({ cooldownMs: 0, damage: 3 });
  const monster = {
    dead: false,
    hp: 5,
    takeHit(damage) {
      this.hp -= damage;
      this.dead = this.hp <= 0;
    }
  };

  assert.deepEqual(combat.hitMonster(monster, 100), { hit: true, defeated: false });
  assert.equal(monster.hp, 2);
});
