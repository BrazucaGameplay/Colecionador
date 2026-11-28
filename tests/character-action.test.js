import test from 'node:test';
import assert from 'node:assert/strict';
import CharacterActionState, { ACTION_PRIORITY } from '../src/rendering/characters/CharacterActionState.js';
import Player from '../src/entities/Player.js';
import MovementSystem from '../src/systems/movement/MovementSystem.js';

test('corrida não substitui uma ação de combate protegida', () => {
  const state = new CharacterActionState();
  const attack = state.start('combat', {
    priority: ACTION_PRIORITY.combat,
    interruptible: true,
    lockMovement: true
  });
  assert.equal(attack.accepted, true);
  assert.equal(state.canStart('running'), false);
  assert.equal(state.start('running').accepted, false);
  assert.equal(state.activeAction, 'combat');
  assert.equal(state.blocksMovement, true);
});

test('combate interrompe locomoção e morte interrompe combate', () => {
  const state = new CharacterActionState();
  assert.equal(state.start('running', { loop: true }).accepted, true);
  assert.equal(state.start('combat', { interruptible: false }).accepted, true);
  assert.equal(state.activeAction, 'combat');
  assert.equal(state.start('dying', {
    interruptible: false,
    holdOnComplete: true,
    lockMovement: true
  }).accepted, true);
  assert.equal(state.activeAction, 'dying');
});

test('cada novo ataque reinicia a mesma animação de combate', () => {
  const state = new CharacterActionState();
  const first = state.start('combat', {
    priority: ACTION_PRIORITY.combat,
    interruptible: true,
    lockMovement: true
  });
  assert.equal(first.accepted, true);
  const second = state.start('combat', {
    priority: ACTION_PRIORITY.combat,
    interruptible: true,
    lockMovement: true,
    restartExisting: true
  });
  assert.equal(second.accepted, true);
  assert.notEqual(second.action.token, first.action.token);
  assert.equal(state.activeAction, 'combat');
  assert.equal(state.blocksMovement, true);
});

test('animação de morte mantém a pose após terminar', () => {
  const state = new CharacterActionState();
  const death = state.start('dying', {
    priority: ACTION_PRIORITY.dying,
    interruptible: false,
    holdOnComplete: true,
    lockMovement: true
  });
  assert.deepEqual(state.complete(death.action.token), { matched: true, held: true });
  assert.equal(state.activeAction, 'dying');
  assert.equal(state.blocksMovement, true);
  assert.deepEqual(state.complete(death.action.token + 1), { matched: false, held: false });
});

test('animação em loop não é finalizada por evento de conclusão', () => {
  const state = new CharacterActionState();
  const run = state.start('running', { loop: true });
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
