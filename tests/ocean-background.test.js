import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOceanBounds } from '../src/world/OceanBounds.js';
import { ISLAND_SHAPE } from '../src/world/IslandShape.js';

test('limites do oceano permanecem centrados na ilha e cobrem o viewport com buffer de pan', () => {
  for (const [width, height] of [[960, 540], [540, 960], [1280, 720], [720, 1280]]) {
    const bounds = calculateOceanBounds(width, height);
    assert.ok(Math.abs(bounds.x + bounds.width / 2 - ISLAND_SHAPE.centerX) < 1e-9);
    assert.ok(Math.abs(bounds.y + bounds.height / 2 - ISLAND_SHAPE.centerY) < 1e-9);
    assert.ok(bounds.width >= width / 0.2 * 1.15);
    assert.ok(bounds.height >= height / 0.2 * 1.15);
    assert.ok(bounds.width > 0 && bounds.height > 0);
  }
});

test('orientação horizontal amplia o eixo horizontal e orientação vertical amplia o eixo vertical', () => {
  const landscape = calculateOceanBounds(960, 540);
  const portrait = calculateOceanBounds(540, 960);
  assert.ok(landscape.width > landscape.height);
  assert.ok(portrait.height > portrait.width);
});

test('dimensões inválidas usam um viewport mínimo seguro', () => {
  const bounds = calculateOceanBounds(0, Number.NaN);
  assert.ok(Number.isFinite(bounds.x));
  assert.ok(Number.isFinite(bounds.y));
  assert.ok(bounds.width > 0 && bounds.height > 0);
});
