import test from 'node:test';
import assert from 'node:assert/strict';
import MovementSystem from '../src/systems/MovementSystem.js';

test('MovementSystem delegates camera-relative input to the player', () => {
  const received = [];
  const player = { move(x, y) { received.push({ x, y }); } };
  const inputController = {
    getMovementVector(rotation) {
      assert.equal(rotation, 90);
      return { x: 0, y: 1 };
    }
  };
  const cameraController = { orientation: 90 };
  const movement = new MovementSystem({ player, inputController, cameraController });

  assert.deepEqual(movement.update(), { x: 0, y: 1 });
  assert.deepEqual(received, [{ x: 0, y: 1 }]);
});

test('MovementSystem becomes inert after destruction', () => {
  const player = { move() { throw new Error('must not move after destroy'); } };
  const movement = new MovementSystem({
    player,
    inputController: { getMovementVector: () => ({ x: 0, y: 0 }) },
    cameraController: { orientation: 0 }
  });

  movement.destroy();
  assert.deepEqual(movement.update(), { x: 0, y: 0 });
});

test('MovementSystem rejects incomplete dependencies', () => {
  assert.throws(() => new MovementSystem({}), TypeError);
});
