import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TERRAIN_REGIONS,
  buildIslandTerrainShader,
  getTerrainMaterialAt
} from '../src/world/IslandTerrainRenderer.js';

test('o desenho do terreno é fixo e não usa distribuição aleatória', () => {
  assert.equal(TERRAIN_REGIONS.length, 9);
  assert.ok(TERRAIN_REGIONS.every(region => ['grass', 'relief'].includes(region.material)));
  const source = readFileSync(new URL('../src/world/IslandTerrainRenderer.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Math\.random|randomBetween|RandomDataGenerator/);
});

test('as regiões de material cobrem proporções estáveis da ilha', () => {
  const counts = { smooth: 0, grass: 0, relief: 0 };
  const samples = 300;
  for (let y = 0; y < samples; y++) {
    for (let x = 0; x < samples; x++) {
      const u = (x + 0.5) / samples;
      const v = (y + 0.5) / samples;
      const material = getTerrainMaterialAt(u, v);
      if (material !== 'ocean') counts[material]++;
    }
  }
  const land = counts.smooth + counts.grass + counts.relief;
  const grass = counts.grass / land;
  const relief = counts.relief / land;
  assert.ok(grass > 0.20 && grass < 0.27, 'grama deve ocupar cerca de 23% da ilha');
  assert.ok(relief > 0.09 && relief < 0.14, 'relevo deve ocupar cerca de 12% da ilha');
  assert.equal(getTerrainMaterialAt(0, 0), 'ocean');
  assert.equal(getTerrainMaterialAt(0.5, 0.5), 'grass');
});

test('shader recorta a ilha no próprio fragmento, sem GeometryMask ou canvas', () => {
  const shader = buildIslandTerrainShader();
  assert.match(shader, /uniform sampler2D uSmooth/);
  assert.match(shader, /uniform sampler2D uGrass/);
  assert.match(shader, /uniform sampler2D uRelief/);
  assert.match(shader, /if \(radius > 1\.0\) discard;/);
  assert.match(shader, /gl_FragColor = vec4\(terrainColor, 1\.0\)/);
  assert.doesNotMatch(shader, /islandAlpha|smoothstep\(0\.998/);
  assert.match(shader, /mirroredRepeat/);
  const source = readFileSync(new URL('../src/world/IslandTerrainRenderer.js', import.meta.url), 'utf8');
  for (const legacyCall of ['createGeometryMask(', 'createCanvas(', 'createAlphaMask(', 'add.tileSprite(', 'setMask(']) assert.ok(!source.includes(legacyCall));
});

test('Game usa somente o renderizador único de terreno e o oceano fica abaixo', () => {
  const source = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  assert.match(source, /createIslandTerrain/);
  assert.match(source, /this\.groundObject = this\.terrain\.object/);
  assert.match(source, /setDepth\(-1200\)/);
  assert.doesNotMatch(source, /groundTiles|groundMasks|TerrainComposer/);
});

test('Preload carrega os três assets materiais usados diretamente pelo shader', () => {
  const source = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  for (const key of ['terrain-smooth', 'terrain-grass', 'terrain-relief']) assert.ok(source.includes(key));
});


test('oceano usa a textura WebP de referencia e TileSprite estático', () => {
  const game = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  const preload = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  const ocean = readFileSync(new URL('../public/assets/world/terrain/ocean-pattern.webp', import.meta.url));
  assert.ok(game.includes('this.add.tileSprite('));
  assert.ok(game.includes("'ocean-pattern'"));
  assert.ok(!game.includes('0x315b78'));
  assert.ok(preload.includes('ocean-pattern.webp'));
  assert.equal(ocean.toString('ascii', 0, 4), 'RIFF');
  assert.equal(ocean.toString('ascii', 8, 12), 'WEBP');
});


test('margem costeira usa a textura WebP no mesmo shader da ilha', () => {
  const game = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  const preload = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  const shaderSource = readFileSync(new URL('../src/world/IslandTerrainRenderer.js', import.meta.url), 'utf8');
  const shoreline = readFileSync(new URL('../public/assets/world/terrain/island-shoreline.webp', import.meta.url));
  assert.match(game, /shorelineKey: 'island-shoreline'/);
  assert.doesNotMatch(game, /createIslandShoreline|shorelineObject/);
  assert.ok(preload.includes('island-shoreline.webp'));
  assert.match(shaderSource, /uniform sampler2D uShoreline/);
  assert.match(shaderSource, /const float LAND_RADIUS = 0\.8/);
  assert.match(shaderSource, /float shoreU = fract\(angle \* 0\.636619772/);
  assert.match(shaderSource, /uShoreline: 3/);
  assert.equal(shoreline.toString('ascii', 0, 4), 'RIFF');
  assert.equal(shoreline.toString('ascii', 8, 12), 'WEBP');
  assert.ok(shoreline.length > 8000, 'textura costeira deve preservar detalhe');
});
