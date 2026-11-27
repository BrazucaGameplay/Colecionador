import * as Phaser from 'phaser';
import { queuePlayerSpriteAssets, registerPlayerSpriteAnimations } from '../rendering/characters/CharacterSpriteRenderer.js';
import { queueMonsterAssets } from '../rendering/monsters/MonsterAssetLoader.js';
const WORLD_ASSETS=[['ocean-pattern','assets/world/terrain/ocean-pattern-seamless-512.webp'],['island-terrain','assets/world/terrain/ilha_terreno.webp'],['tree-forest-broad','assets/world/vegetation/arvore_ilha_webp_256.webp'],['tree-forest-pine','assets/world/vegetation/pinheiro_ilha_webp_384.webp'],['tree-ancestral','assets/world/vegetation/arvore_ancestral_toca_webp_640.webp']];
export default class Preload extends Phaser.Scene{
 constructor(){super('Preload');}
 preload(){
  const{width,height}=this.scale,started=performance.now();this.registry.set('assetLoadPercent',0);this.registry.set('assetLoadDurationMs',0);
  this.add.rectangle(width/2,height/2,300,20,0x222222).setOrigin(.5);const fill=this.add.rectangle(width/2-140,height/2,0,12,0x22c55e).setOrigin(0,.5),label=this.add.text(width/2,height/2+40,'Carregando mundo... 0%',{fontSize:'16px',color:'#ffffff'}).setOrigin(.5);
  this.load.on('progress',p=>{const n=Math.round(p*100);this.registry.set('assetLoadPercent',n);fill.width=280*p;label.setText('Carregando mundo... '+n+'%');});
  this.load.once(Phaser.Loader.Events.COMPLETE,()=>{this.registry.set('assetLoadPercent',100);this.registry.set('assetLoadDurationMs',performance.now()-started);});
  this.load.on('loaderror',file=>{console.error('Falha ao carregar asset final:',file.key,file.src);label.setText('Falha ao carregar recursos do jogo.');});
  for(const[key,url]of WORLD_ASSETS)this.load.image(key,import.meta.env.BASE_URL+url+'?v=20261126-ocean-seamless-512-v36');
  // Repouso e movimento são essenciais. Pacotes de ação serão buscados no primeiro uso.
  queuePlayerSpriteAssets(this.load);queueMonsterAssets(this.load);
 }
 create(){const g=this.make.graphics({add:false});g.fillStyle(0xffffff,0);g.fillRect(0,0,2,2);g.generateTexture('player',2,2);g.destroy();registerPlayerSpriteAnimations(this);this.scene.start('Game');}
}
