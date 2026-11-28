import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WAIFU_QUALITIES,
  WAIFU_RARITIES,
  WAIFU_QUALITY_IDS,
  WAIFU_RARITY_IDS,
  isWaifuQuality,
  isWaifuRarity
} from '../src/data/waifus/classification.js';

test('classificações de raridade e qualidade mantêm os nomes aprovados', () => {
  assert.deepEqual(
    Object.values(WAIFU_RARITIES).map(({ name }) => name),
    ['Comum', 'Rara', 'Épica', 'Lendária', 'Mítica']
  );
  assert.deepEqual(
    Object.values(WAIFU_QUALITIES).map(({ id, name }) => [id, name]),
    [['D', 'Plebeia'], ['C', 'Nobre'], ['B', 'Dama'], ['A', 'Princesa'], ['S', 'Rainha']]
  );
});

test('classificações aceitam somente IDs cadastrados', () => {
  assert.deepEqual(WAIFU_RARITY_IDS, ['common', 'rare', 'epic', 'legendary', 'mythical']);
  assert.deepEqual(WAIFU_QUALITY_IDS, ['D', 'C', 'B', 'A', 'S']);
  assert.equal(isWaifuRarity('mythical'), true);
  assert.equal(isWaifuRarity('divine'), false);
  assert.equal(isWaifuQuality('S'), true);
  assert.equal(isWaifuQuality('SS'), false);
});
