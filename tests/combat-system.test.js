import test from 'node:test';
import assert from 'node:assert/strict';
import CombatSystem from '../src/systems/combat/CombatSystem.js';
import MovementSystem from '../src/systems/movement/MovementSystem.js';
import Player from '../src/entities/Player.js';

function setup() {
  const player = new Player({ x: 0, y: 0, speed: 100 });
  const navigation = {
    width: 1000, height: 1000,
    findNearestWalkablePoint: (x, y) => ({ x, y }),
    findPath: (x, y, tx, ty) => [{ x: tx, y: ty }],
    isAreaWalkable: () => true
  };
  const movement = new MovementSystem(player, navigation);
  const target = { id: 'slime-1', x: 300, y: 0, alive: true };
  const attacks = [];
  const combat = new CombatSystem({ player, movement, getTargets: () => [target], onAttack: (...args) => attacks.push(args) });
  return { player, movement, target, attacks, combat };
}

test('combate persegue alvos sem depender de renderer ou animação', () => {
  const f = setup();
  f.combat.update(0);
  assert.deepEqual(f.movement.destination, { x: 300, y: 0 });
  assert.equal(f.attacks.length, 0);
});

test('ataque ocorre no alcance e respeita cooldown lógico', () => {
  const f = setup();
  f.target.x = 100;
  f.combat.update(0);
  f.combat.update(200);
  assert.equal(f.attacks.length, 1);
  assert.equal(f.attacks[0][4], 1000);
  f.combat.update(500);
  assert.equal(f.attacks.length, 1);
  f.combat.update(999);
  assert.equal(f.attacks.length, 1);
  f.combat.update(1000);
  assert.equal(f.attacks.length, 2);
});

test('destino manual sempre prevalece sobre perseguição automática', () => {
  const f = setup();
  f.movement.setDestination(800, 800);
  const destination = f.movement.destination;
  f.combat.update(0);
  assert.equal(f.movement.destination, destination);
  assert.equal(f.movement.hasManualDestination, true);
  assert.equal(f.attacks.length, 0);
});

test('alvo morto não recebe novos ataques', () => {
  const f = setup();
  f.target.x = 50;
  f.combat.update(0);
  f.target.alive = false;
  f.combat.update(600);
  assert.equal(f.attacks.length, 1);
});
