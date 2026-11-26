import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTerrainRegions } from '../src/world/TerrainComposer.js';

test('terreno distribui células em proporções de 70/20/10 sem sobreposição', () => {
  const result = buildTerrainRegions({ diameter: 4096, cellSize: 64 });
  assert.equal(result.smoothCount + result.grassCells.length + result.reliefCells.length, result.eligibleCells);
  assert.ok(Math.abs(result.distribution.smooth - 0.70) < 0.01);
  assert.ok(Math.abs(result.distribution.grass - 0.20) < 0.01);
  assert.ok(Math.abs(result.distribution.relief - 0.10) < 0.01);
  const keys = new Set();
  for (const cell of [...result.grassCells, ...result.reliefCells]) {
    const key = cell.x + ':' + cell.y;
    assert.ok(!keys.has(key), 'Célula repetida entre tipos de terreno: ' + key);
    keys.add(key);
    const cx = cell.x + cell.width / 2;
    const cy = cell.y + cell.height / 2;
    assert.ok(Math.hypot(cx - 2048, cy - 2048) + Math.hypot(cell.width, cell.height) / 2 <= 2046);
  }
});

test('distribuição é determinística e cria manchas espalhadas', () => {
  const first = buildTerrainRegions();
  const second = buildTerrainRegions();
  assert.deepEqual(first.grassCells, second.grassCells);
  assert.deepEqual(first.reliefCells, second.reliefCells);
  const quadrants = new Set([...first.grassCells, ...first.reliefCells].map(cell =>
    (cell.y < 2048 ? 'N' : 'S') + (cell.x < 2048 ? 'W' : 'E')
  ));
  assert.equal(quadrants.size, 4);
});

test('composição do jogo usa TileSprites e não cria canvas 4096x4096', () => {
  const source = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  assert.match(source, /createTerrainLayers/);
  assert.doesNotMatch(source, /createElement\(['"]canvas['"]\)/);
  assert.doesNotMatch(source, /addCanvas\(/);
});

test('preload carrega somente as três texturas novas de terreno', () => {
  const source = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  for (const key of ['terrain-smooth', 'terrain-grass', 'terrain-relief']) assert.ok(source.includes(key));
  assert.doesNotMatch(source, /terreno-01\.png|island-01\.png/);
});
