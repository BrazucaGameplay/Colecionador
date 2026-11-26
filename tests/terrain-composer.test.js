import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeTerrainPattern, createTerrainLayers } from '../src/world/TerrainComposer.js';

test('composição usa três fontes e cria um único padrão repetível de 512px', () => {
  const source = readFileSync(new URL('../src/world/TerrainComposer.js', import.meta.url), 'utf8');
  assert.match(source, /PATTERN_SIZE = 512/);
  assert.match(source, /smoothKey/);
  assert.match(source, /grassKey/);
  assert.match(source, /reliefKey/);
  assert.doesNotMatch(source, /buildTerrainRegions|syncTerrainLayersToCamera|fillRect\(cell/);
});

test('a ilha usa um único TileSprite com recorte circular', () => {
  const source = readFileSync(new URL('../src/world/TerrainComposer.js', import.meta.url), 'utf8');
  assert.match(source, /fillCircle\(center, center, center - 2\)/);
  assert.match(source, /add\.tileSprite\(0, 0, diameter, diameter, pattern\.textureKey\)/);
  assert.match(source, /setMask\(circleMask\)/);
  assert.match(source, /tiles: \[terrain\]/);
});

test('a cena não reposiciona camadas do terreno por quadro nem cria nuvens em lote', () => {
  const source = readFileSync(new URL('../src/scenes/Game.js', import.meta.url), 'utf8');
  assert.match(source, /createTerrainLayers/);
  assert.match(source, /createOceanBackground/);
  assert.doesNotMatch(source, /syncTerrainLayersToCamera|createCloudBoundary|generated-cloud-sea/);
  assert.doesNotMatch(source, /for \(let i = 0; i < count; i\+\+\)/);
});

test('Preload continua carregando as três texturas finais, sem imagem única antiga', () => {
  const source = readFileSync(new URL('../src/scenes/Preload.js', import.meta.url), 'utf8');
  for (const key of ['terrain-smooth', 'terrain-grass', 'terrain-relief']) assert.ok(source.includes(key));
  assert.doesNotMatch(source, /terreno-01\.png|island-01\.png/);
});
