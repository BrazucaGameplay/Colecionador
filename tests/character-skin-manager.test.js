import test from 'node:test';
import assert from 'node:assert/strict';
import SkinManager from '../src/rendering/characters/SkinManager.js';
import {CHARACTER_SKINS,DEFAULT_CHARACTER_SKIN,REQUIRED_SKIN_ANIMATIONS} from '../src/rendering/characters/CharacterSkinCatalog.js';

test('skin original é padrão e pronta',()=>{
 const manager=new SkinManager({assetValidator:id=>id==='skin_01'});
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
 assert.equal(manager.getSelectedDefinition().status,'ready');
});
test('skin 2 permanece indisponível até os atlas existirem',()=>{
 const manager=new SkinManager({selectedSkin:'skin_2',assetValidator:id=>id==='skin_01'});
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
 assert.equal(manager.isSelectable('skin_2'),false);
 assert.equal(manager.getCatalog().find(s=>s.id==='skin_2').status,'preparation');
 assert.deepEqual(Object.keys(CHARACTER_SKINS.skin_2.references).sort(),['combat','dying','idle','running']);
});
test('contrato reserva oito estados lógicos por skin',()=>{
 assert.deepEqual(REQUIRED_SKIN_ANIMATIONS,['idle','walking','running','dying','flirtyStrut','combat','combatSlash','jump']);
 for(const skin of Object.values(CHARACTER_SKINS))for(const id of REQUIRED_SKIN_ANIMATIONS)assert.ok(skin.animations[id]);
});
test('seleção exige assets validados',()=>{
 const manager=new SkinManager({assetValidator:id=>id==='skin_01'});
 assert.equal(manager.selectSkin('skin_2').reason,'skin-not-ready');
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
});
test('renderer pode recusar troca sem alterar seleção',()=>{
 const manager=new SkinManager({assetValidator:()=>true,onChange:()=>({changed:false,reason:'action-active'})});
 assert.equal(manager.selectSkin('skin_test').reason,'action-active');
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
});
test('seleção muda apenas após confirmação do renderer',()=>{
 const manager=new SkinManager({assetValidator:()=>true,onChange:()=>({changed:true})});
 assert.equal(manager.selectSkin('skin_test').changed,true);
 assert.equal(manager.getSelectedSkin(),'skin_test');
});
