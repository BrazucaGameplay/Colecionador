import test from 'node:test';
import assert from 'node:assert/strict';
import SaveManager from '../src/systems/persistence/SaveManager.js';

const storage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return { values, getItem(k) { return values.has(k) ? values.get(k) : null; }, setItem(k,v) { values.set(k,String(v)); } };
};
const logger = () => { const warnings=[]; return { warnings, warn(...args) { warnings.push(args); } }; };

test('carrega save existente sem mudar chave ou formato', () => {
  const previous={score:17,player:{level:4,experience:125,statPoints:2,stats:{attack:8},health:75,energy:40},at:123456};
  const s=storage({'colecionador-save-v1':JSON.stringify(previous)});
  const manager=new SaveManager({key:'colecionador-save-v1',storage:s,logger:logger()});
  assert.deepEqual(manager.load(),previous);
});

test('mescla atualizações e preserva timestamp no campo at', () => {
  const s=storage({save:JSON.stringify({score:5,settings:{music:true}})});
  const manager=new SaveManager({key:'save',storage:s,now:()=>987654,logger:logger()});
  manager.load();
  assert.equal(manager.save({score:6,player:{level:2}}),true);
  assert.deepEqual(JSON.parse(s.getItem('save')),{score:6,settings:{music:true},player:{level:2},at:987654});
});

test('mantém campos de progressão compatíveis com Player.toSaveData', () => {
  const s=storage();
  const manager=new SaveManager({key:'save',storage:s,now:()=>10,logger:logger()});
  manager.save({score:2,player:{level:3,experience:80,statPoints:1,stats:{attack:7},health:90,energy:60}});
  const player=JSON.parse(s.getItem('save')).player;
  assert.deepEqual(Object.keys(player).sort(),['energy','experience','health','level','statPoints','stats']);
});

test('JSON malformado, array e null iniciam progresso vazio', () => {
  const log=logger();
  for(const raw of ['{broken','[]','null']) {
    const manager=new SaveManager({key:'save',storage:storage({save:raw}),logger:log});
    assert.deepEqual(manager.load(),{});
  }
  assert.equal(log.warnings.length,1);
});

test('falha de storage é capturada e save retorna false', () => {
  const log=logger();
  const s={getItem(){throw Error('read blocked');},setItem(){throw Error('quota');}};
  const manager=new SaveManager({key:'save',storage:s,logger:log,now:()=>42});
  assert.deepEqual(manager.load(),{});
  assert.equal(manager.save({score:1}),false);
  assert.equal(manager.data.score,1);
  assert.equal(log.warnings.length,2);
});

test('exige chave de persistência', () => {
  assert.throws(()=>new SaveManager(),/chave de persistência/);
});
