import test from 'node:test';
import assert from 'node:assert/strict';
import CharacterActionState, { ACTION_PRIORITY } from '../src/rendering/characters/CharacterActionState.js';
import Player from '../src/entities/Player.js';
import MovementSystem from '../src/systems/MovementSystem.js';

test('corrida e locomoção não substituem uma ação de combate protegida', () => {
  const state = new CharacterActionState();
  const attack = state.start('combat', { priority: ACTION_PRIORITY.combat, interruptible: false, lockMovement: true });
  assert.equal(attack.accepted, true);
  assert.equal(state.canStart('running', { priority: ACTION_PRIORITY.locomotion }), false);
  assert.equal(state.start('running', { priority: ACTION_PRIORITY.locomotion }).accepted, false);
  assert.equal(state.activeAction, 'combat');
  assert.equal(state.blocksMovement, true);
});

test('ação superior pode interromper ação inferior quando permitido', () => {
  const state = new CharacterActionState();
  assert.equal(state.start('jump', { priority: ACTION_PRIORITY.jump, interruptible: true }).accepted, true);
  assert.equal(state.start('combat', { priority: ACTION_PRIORITY.combat, interruptible: false }).accepted, true);
  assert.equal(state.activeAction, 'combat');
  assert.equal(state.start('death', { priority: ACTION_PRIORITY.death, interruptible: false, holdOnComplete: true, lockMovement: true }).accepted, true);
  assert.equal(state.activeAction, 'death');
});

test('animação não repetida termina uma única vez e mantém a pose de morte', () => {
  const state = new CharacterActionState();
  const death = state.start('death', { priority: ACTION_PRIORITY.death, interruptible: false, holdOnComplete: true, lockMovement: true });
  assert.deepEqual(state.complete(death.action.token), { matched: true, held: true });
  assert.equal(state.activeAction, 'death');
  assert.equal(state.blocksMovement, true);
  assert.deepEqual(state.complete(death.action.token + 1), { matched: false, held: false });
});

test('animação em loop não é finalizada por evento de conclusão', () => {
  const state = new CharacterActionState();
  const run = state.start('running', { priority: ACTION_PRIORITY.locomotion, loop: true });
  assert.equal(state.complete(run.action.token).matched, false);
  assert.equal(state.activeAction, 'running');
});

test('movimento pausa durante ataque sem perder destino e rota', () => {
  const player = new Player({ x: 0, y: 0, speed: 100 });
  const navigation = {
    width: 500,
    height: 500,
    findNearestWalkablePoint: (x, y) => ({ x, y }),
    findPath: () => [{ x: 100, y: 0 }],
    isAreaWalkable: () => true
  };
  const movement = new MovementSystem(player, navigation);
  assert.equal(movement.setDestination(100, 0), true);
  movement.setPaused(true);
  movement.update(1000);
  assert.equal(player.x, 0);
  assert.equal(movement.route.length, 1);
  assert.deepEqual(movement.destination, { x: 100, y: 0 });
  movement.setPaused(false);
  movement.update(100);
  assert.equal(player.x, 5);
  assert.equal(movement.route.length, 1);
});
