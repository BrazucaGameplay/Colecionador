import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');

test('Game delega a câmera ao CameraController e segue o sprite visual', () => {
  assert.match(game, /cameraController\.initialize\(this\.characterRenderer\.sprite\)/);
  assert.match(game, /cameraController\.followPlayer\(\)/);
  assert.doesNotMatch(game, /startFollow\(this\.playerBody\.object/);
  assert.doesNotMatch(game, /\.startFollow\(/);
});
