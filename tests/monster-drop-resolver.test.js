import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTER_DROP_TABLES, getMonsterDropTable } from '../src/data/monsters/drop-tables.js';
import { rollMonsterDrops } from '../src/systems/monsters/MonsterDropResolver.js';

function sequence(...values) {
  let index = 0;
  return () => values[index++] ?? 0.999999;
}

test('cada espécie possui tabela própria e espécie sem cadastro não herda drops', () => {
  assert.deepEqual(Object.keys(MONSTER_DROP_TABLES), ['slime']);
  assert.equal(getMonsterDropTable('slime').length, 1);
  assert.deepEqual(getMonsterDropTable('wolf'), []);
});

test('Slime tem 20% de chance de conceder a carta Donzela Slime', () => {
  const drop = rollMonsterDrops('slime', { random: sequence(0.199999, 0.999999) });
  assert.equal(drop.length, 1);
  assert.deepEqual(
    { waifuId: drop[0].waifuId, name: drop[0].name, quality: drop[0].quality },
    { waifuId: 'slime-maiden', name: 'Donzela Slime', quality: 'D' }
  );
  assert.deepEqual(rollMonsterDrops('slime', { random: sequence(0.2) }), []);
});

test('qualidades respeitam exatamente S 1%, A 2%, B 3%, C 4%, D 90%', () => {
  const cases = [
    [0.0, 'S'], [0.009999, 'S'],
    [0.01, 'A'], [0.029999, 'A'],
    [0.03, 'B'], [0.059999, 'B'],
    [0.06, 'C'], [0.099999, 'C'],
    [0.10, 'D'], [0.999999, 'D']
  ];
  for (const [ticket, expected] of cases) {
    const [drop] = rollMonsterDrops('slime', { random: sequence(0, ticket) });
    assert.equal(drop.quality, expected);
  }
});

test('qualidade só é sorteada quando a carta cai', () => {
  let calls = 0;
  const random = () => { calls++; return 0.5; };
  assert.deepEqual(rollMonsterDrops('slime', { random }), []);
  assert.equal(calls, 1);
});

test('rejeita fonte aleatória fora do intervalo válido', () => {
  assert.throws(() => rollMonsterDrops('slime', { random: () => 1 }), RangeError);
});
