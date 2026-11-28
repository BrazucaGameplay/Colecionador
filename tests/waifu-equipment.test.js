import test from 'node:test';
import assert from 'node:assert/strict';
import WaifuEquipmentManager from '../src/systems/waifus/WaifuEquipmentManager.js';
import WaifuAbilitySystem from '../src/systems/waifus/WaifuAbilitySystem.js';

const card = (instanceId, waifuId = 'slime-maiden') => ({ instanceId, waifuId, name: 'Donzela Slime', quality: 'D' });

test('equipamento aceita somente cartas possuídas e limita três espaços', () => {
  const equipment = new WaifuEquipmentManager({ collection: [card('a'), card('b'), card('c'), card('d')] });
  assert.equal(equipment.equip('missing').reason, 'not-owned');
  assert.equal(equipment.equip('a').changed, true);
  assert.equal(equipment.equip('b').changed, true);
  assert.equal(equipment.equip('c').changed, true);
  assert.equal(equipment.equip('d').reason, 'slots-full');
  assert.equal(equipment.getEquipped().length, 3);
  assert.equal(equipment.equip('a').reason, 'already-equipped');
});

test('equipamento remove carta e reconcilia IDs ausentes do save', () => {
  const equipment = new WaifuEquipmentManager({ collection: [card('a'), card('b')], equippedIds: ['a', 'missing', 'b'] });
  assert.deepEqual(equipment.toSaveData(), ['a', 'b']);
  assert.equal(equipment.unequip(0).changed, true);
  assert.deepEqual(equipment.toSaveData(), ['b']);
});

test('habilidade da carta dispara automaticamente e respeita cooldown individual de dez segundos', () => {
  const equipment = new WaifuEquipmentManager({ collection: [card('a'), card('b')] });
  equipment.equip('a'); equipment.equip('b');
  const events = [];
  const abilities = new WaifuAbilitySystem({ equipment, onProjectile: event => events.push(event) });
  const target = { id: 'slime-1', alive: true };
  assert.equal(abilities.tryActivate(target, 0).length, 2);
  assert.equal(events[0].ability.id, 'blue-slime-projectile');
  assert.equal(events[0].ability.damage, 10);
  assert.equal(events[0].ability.cooldownMs, 10000);
  assert.equal(abilities.tryActivate(target, 9999).length, 0);
  assert.equal(abilities.tryActivate(target, 10000).length, 2);
  assert.equal(events.length, 4);
});

test('habilidade não dispara sem alvo vivo ou sem carta equipada', () => {
  const equipment = new WaifuEquipmentManager({ collection: [card('a')] });
  let shots = 0;
  const abilities = new WaifuAbilitySystem({ equipment, onProjectile: () => { shots++; } });
  assert.deepEqual(abilities.tryActivate({ id: 'dead', alive: false }, 0), []);
  assert.deepEqual(abilities.tryActivate({ id: 'live', alive: true }, 0), []);
  equipment.equip('a');
  assert.equal(abilities.tryActivate({ id: 'live', alive: true }, 0).length, 1);
  assert.equal(shots, 1);
});
