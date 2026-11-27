import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const game = read('../src/scenes/Game.js');
const bootstrap = read('../src/systems/GameSystemsBootstrap.js');

test('Game delega a câmera ao CameraController e segue o sprite visual', () => {
  assert.match(game, /cameraController\.initialize\(this\.characterRenderer\.sprite\)/);
  assert.match(bootstrap, /cameraController\.followPlayer\(\{ smoothReturn: true \}\)/);
  assert.doesNotMatch(game, /startFollow\(this\.playerBody\.object/);
  assert.doesNotMatch(game, /\.startFollow\(/);
});
