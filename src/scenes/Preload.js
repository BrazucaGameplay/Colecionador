import * as Phaser from 'phaser';
import { queuePlayerSpriteAssets, registerPlayerSpriteAnimations } from '../rendering/characters/CharacterSpriteRenderer.js';
import { queueMonsterAssets } from '../rendering/monsters/MonsterAssetLoader.js';
import TreeTexturePipeline from '../rendering/world/TreeTexturePipeline.js';
import { preloadHtmlUiAssets } from '../core/lifecycle/HtmlUiAssetPreloader.js';

const WORLD_ASSETS=[
 ['ocean-pattern','assets/world/terrain/ocean-pattern-seamless-512.webp'],
 ['island-terrain','assets/world/terrain/ilha_terreno.webp'],
 ['tree-forest-broad','assets/world/vegetation/arvore_ilha_webp_256.webp'],
 ['tree-forest-pine','assets/world/vegetation/pinheiro_ilha_webp_384.webp'],
 ['tree-ancestral','assets/world/vegetation/arvore_ancestral_toca_webp_640.webp']
];
const TREE_TEXTURE_KEYS=['tree-forest-broad','tree-forest-pine','tree-ancestral'];
function notifyLoading(progress,message){window.dispatchEvent(new CustomEvent('colecionador:loading-progress',{detail:{progress,message}}));}
export default class Preload extends Phaser.Scene{
 constructor(){super('Preload');}
 preload(){
  const started=performance.now();this.registry.set('assetLoadPercent',0);this.registry.set('assetLoadDurationMs',0);notifyLoading(0,'Preparando recursos...');
  this.load.on('progress',progress=>{this.registry.set('assetLoadPercent',Math.round(progress*80));notifyLoading(progress*.8,'Carregando recursos do mundo...');});
  this.load.once(Phaser.Loader.Events.COMPLETE,()=>{this.registry.set('assetLoadPercent',80);this.registry.set('assetLoadDurationMs',performance.now()-started);notifyLoading(.8,'Carregando imagens da interface...');});
  this.load.on('loaderror',file=>{console.error('Falha ao carregar asset final:',file.key,file.src);notifyLoading(this.load.progress*.8,'Verificando recursos...');});
  for(const [key,url] of WORLD_ASSETS)this.load.image(key,import.meta.env.BASE_URL+url+'?v=20261126-ocean-seamless-512-v36');
  queuePlayerSpriteAssets(this.load);queueMonsterAssets(this.load);
 }
 async create(){
  this.registry.set('htmlUiAssetsReady',false);
  try{
   await preloadHtmlUiAssets((loaded,total,path)=>{
    const progress=.8+(.19*loaded/total);
    notifyLoading(progress,'Preparando imagens da interface ('+loaded+'/'+total+')...');
   });
   this.registry.set('htmlUiAssetsReady',true);
   notifyLoading(.99,'Finalizando...');
  }catch(error){
   console.error('A inicialização foi interrompida porque uma imagem HTML obrigatória não carregou.',error);
   window.dispatchEvent(new CustomEvent('colecionador:loading-error',{detail:{message:error.message}}));
   return;
  }
  this.registry.set('treeTextureProfiles',new TreeTexturePipeline(this).prepare(TREE_TEXTURE_KEYS));
  const graphics=this.make.graphics({add:false});graphics.fillStyle(0xffffff,0);graphics.fillRect(0,0,2,2);graphics.generateTexture('player',2,2);graphics.destroy();
  // A cena Game é outra instância: publicar os mapas no registry compartilhado antes de iniciá-la.
  registerPlayerSpriteAnimations(this);
  this.scene.start('Game');
 }
}
