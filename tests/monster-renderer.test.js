import test from 'node:test';
import assert from 'node:assert/strict';
import { fitMonsterFrameScale } from '../src/rendering/monsters/MonsterRenderer.js';

test('normaliza quadros de proporções diferentes sem deformar o sprite', () => {
  const target = { width: 80, height: 60 };
  const wide = fitMonsterFrameScale(200, 80, target.width, target.height);
  const tall = fitMonsterFrameScale(80, 200, target.width, target.height);
  assert.equal(wide, 0.4);
  assert.equal(tall, 0.3);
  assert.ok(200 * wide <= target.width);
  assert.ok(80 * wide <= target.height);
  assert.ok(80 * tall <= target.width);
  assert.ok(200 * tall <= target.height);
});

test('escala inválida não gera tamanho infinito ou negativo', () => {
  assert.equal(fitMonsterFrameScale(0, 10, 20, 20), 1);
  assert.equal(fitMonsterFrameScale(10, 10, 0, 20), 1);
});
