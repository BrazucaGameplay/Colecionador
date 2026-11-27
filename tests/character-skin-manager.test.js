import test from 'node:test';
import assert from 'node:assert/strict';
import SkinManager from '../src/rendering/characters/SkinManager.js';
import {CHARACTER_SKINS,DEFAULT_CHARACTER_SKIN,REQUIRED_SKIN_ANIMATIONS} from '../src/rendering/characters/CharacterSkinCatalog.js';
import {getCharacterAnimationsForSkin} from '../src/rendering/characters/CharacterAnimationCatalog.js';

const testCatalog={...CHARACTER_SKINS,skin_test:{...CHARACTER_SKINS.skin_01,id:'skin_test',name:'Skin de teste'}};
test('skin original é padrão e pronta',()=>{
 const manager=new SkinManager({assetValidator:id=>id==='skin_01'});
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
 assert.equal(manager.getSelectedDefinition().status,'ready');
});
test('skin 2 possui quatro atlas e fica selecionável após validação',()=>{
 const manager=new SkinManager({selectedSkin:'skin_2',assetValidator:id=>id==='skin_01'});
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
 assert.equal(manager.isSelectable('skin_2'),false);
 assert.equal(CHARACTER_SKINS.skin_2.status,'ready');
 assert.deepEqual(Object.keys(CHARACTER_SKINS.skin_2.animations).sort(),['combat','dying','idle','running']);
 assert.equal(CHARACTER_SKINS.skin_2.portrait,'assets/characters/sprites/skin_2/perfil.png');
});
test('contrato exige exatamente quatro animações por skin',()=>{
 assert.deepEqual(REQUIRED_SKIN_ANIMATIONS,['idle','running','combat','dying']);
 for(const skin of Object.values(CHARACTER_SKINS))assert.deepEqual(Object.keys(skin.animations),REQUIRED_SKIN_ANIMATIONS);
});
test('seleção exige assets validados',()=>{
 const manager=new SkinManager({assetValidator:id=>id==='skin_01'});
 assert.equal(manager.selectSkin('skin_2').reason,'skin-not-ready');
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
});
test('renderer pode recusar troca sem alterar seleção',()=>{
 const manager=new SkinManager({catalog:testCatalog,assetValidator:()=>true,onChange:()=>({changed:false,reason:'action-active'})});
 assert.equal(manager.selectSkin('skin_test').reason,'action-active');
 assert.equal(manager.getSelectedSkin(),DEFAULT_CHARACTER_SKIN);
});
test('a nova skin já está selecionada durante o callback de persistência',()=>{
 let manager;
 let observed;
 manager=new SkinManager({
  catalog:testCatalog,
  assetValidator:()=>true,
  onChange:({selectedSkin})=>{observed=manager.getSelectedSkin();return{changed:true};}
 });
 assert.equal(manager.selectSkin('skin_test').changed,true);
 assert.equal(observed,'skin_test');
 assert.equal(manager.getSelectedSkin(),'skin_test');
});
test('seleção muda apenas após confirmação do renderer',()=>{
 const manager=new SkinManager({catalog:testCatalog,assetValidator:()=>true,onChange:()=>({changed:true})});
 assert.equal(manager.selectSkin('skin_test').changed,true);
 assert.equal(manager.getSelectedSkin(),'skin_test');
});

test('fábrica de animações cria somente quatro pacotes por skin',()=>{
 const animations=getCharacterAnimationsForSkin(CHARACTER_SKINS.skin_01);
 assert.deepEqual(Object.keys(animations),['idle','running','combat','dying']);
 assert.equal(new Set(Object.values(animations).map(item=>item.key)).size,4);
 assert.ok(animations.idle.path.endsWith('/skin_01/skin-basicas-idle'));
 assert.ok(animations.running.path.endsWith('/skin_01/skin-basicas-running'));
 assert.ok(animations.combat.path.endsWith('/skin_01/skin-batalha-combate_dd'));
 assert.ok(animations.dying.path.endsWith('/skin_01/skin-basicas-dead'));
});
