import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');

test('camera acompanha o sprite renderizado, não a zona física sincronizada', () => {
  assert.equal((game.match(/startFollow\(this\.characterRenderer\.sprite/g) || []).length, 2);
  assert.doesNotMatch(game, /startFollow\(this\.playerBody\.object/);
});
