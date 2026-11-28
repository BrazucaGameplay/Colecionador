import test from 'node:test';
import assert from 'node:assert/strict';
import { getBestiaryCatalog, getBestiaryEntries } from '../src/data/bestiary/index.js';
import { BOSS_DEFINITIONS, getBossDefinition } from '../src/data/bosses/index.js';

test('bestiário separa catálogo de espécies comuns e catálogo de Boss únicos', () => {
  const catalog = getBestiaryCatalog();
  assert.ok(Array.isArray(catalog.monsters));
  assert.ok(Array.isArray(catalog.bosses));
  assert.ok(catalog.monsters.some(entry => entry.id === 'slime' && entry.category === 'monster'));
  assert.deepEqual(catalog.bosses, []);
  assert.deepEqual(BOSS_DEFINITIONS, {});
  assert.equal(getBossDefinition('not-registered'), null);
});

test('consulta do bestiário retorna uma entrada por definição, não por instância', () => {
  const monsters = getBestiaryEntries('monsters');
  const all = getBestiaryEntries('all');
  assert.equal(monsters.filter(entry => entry.id === 'slime').length, 1);
  assert.equal(all.length, monsters.length);
  assert.equal(getBestiaryEntries('unknown').length, 0);
  assert.equal(getBestiaryEntries('bosses').length, 0);
});


test('Slime é a primeira carta conectada; imagens arquivadas não viram registros automaticamente', () => {
  const catalog = getBestiaryCatalog();
  assert.equal(catalog.monsters.length, 1);
  assert.equal(catalog.monsters[0].id, 'slime');
  assert.equal(catalog.monsters[0].cardAsset, 'assets/cards/monsters/slime/card.jpg');
  assert.deepEqual(catalog.bosses, []);
});
