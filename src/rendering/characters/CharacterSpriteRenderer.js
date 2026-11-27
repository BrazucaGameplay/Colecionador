import * as Phaser from 'phaser';
import CharacterActionState from './CharacterActionState.js';
import { getDirectionalAtlasLayouts } from './DirectionalAtlasLayout.js';
import { CHARACTER_ANIMATIONS, COMBAT_ANIMATION_SEQUENCE, DEFAULT_CHARACTER_SCALE, DEFAULT_FAST_MOVEMENT_ANIMATION, DEFAULT_IDLE_ANIMATION, DEFAULT_MOVEMENT_ANIMATION } from './CharacterAnimationCatalog.js';
const BASE=import.meta.env.BASE_URL;
const entries=[...new Map(Object.values(CHARACTER_ANIMATIONS).map(item=>[item.key,item])).values()];
const essential=new Set(['idle','running']);
const textureKey=(item,direction)=>`${item.key}-d${direction}`;
function registerEntry(scene,item){
 const meta=scene.cache.json.get(item.key+'-meta');
 const source=scene.textures.get(item.key+'-source')?.getSourceImage?.();
 if(!meta||!source||!meta.frames?.length){console.warn('[CharacterAnimations] Pacote indisponível:',item.id);return false;}
 const layouts=getDirectionalAtlasLayouts(meta.frames,meta.frameSize);
 scene.playerFramePivots ||= new Map();
 for(const layout of layouts){
  const key=textureKey(item,layout.direction);
  let texture=scene.textures.get(key);
  if(!texture){
   texture=scene.textures.createCanvas(key,layout.width,layout.height);
   if(!texture)throw new Error('Falha ao criar atlas direcional '+key);
   const ctx=texture.getContext();
   for(let i=0;i<layout.frames.length;i++){
    const frame=layout.frames[i],x=(i%layout.columns)*meta.frameSize.width,y=Math.floor(i/layout.columns)*meta.frameSize.height;
    ctx.drawImage(source,frame.x,frame.y,frame.width,frame.height,x,y,frame.width,frame.height);
    const name='f'+frame.frame;texture.add(name,0,x,y,frame.width,frame.height);
    const pivot=Number(frame.pivotY??meta.pivot?.y);
    if(Number.isFinite(pivot))scene.playerFramePivots.set(key+':'+name,Math.max(0,Math.min(1,pivot)));
   }
   texture.refresh();
  }
  const animKey=item.key+'-d'+layout.direction;
  if(!scene.anims.exists(animKey))scene.anims.create({key:animKey,frames:layout.frames.map(frame=>({key,frame:'f'+frame.frame})),frameRate:meta.fps||12,repeat:item.loop?-1:0});
 }
 scene.textures.remove(item.key+'-source');
 return true;
}
export function queuePlayerSpriteAssets(loader,items=entries.filter(item=>essential.has(item.id))){
 for(const item of items){loader.json(item.key+'-meta',BASE+item.path+'.json');loader.image(item.key+'-source',BASE+item.path+'.png');}
}
export function registerPlayerSpriteAnimations(scene,items=entries.filter(item=>essential.has(item.id))){
 let ok=true;for(const item of items)ok=registerEntry(scene,item)&&ok;return ok;
}
export function loadPlayerSpriteAnimation(scene,id){
 const item=entries.find(entry=>entry.id===id);if(!item)return Promise.resolve(false);
 if(scene.anims.exists(item.key+'-d0'))return Promise.resolve(true);
 scene.playerAnimationLoads ||= new Map();
 if(scene.playerAnimationLoads.has(id))return scene.playerAnimationLoads.get(id);
 const promise=new Promise(resolve=>{
  const finish=()=>{scene.load.off('loaderror',onError);resolve(registerEntry(scene,item));};
  const onError=file=>{if(file?.key===item.key+'-meta'||file?.key===item.key+'-source'){scene.load.off(Phaser.Loader.Events.COMPLETE,finish);scene.load.off('loaderror',onError);resolve(false);}};
  scene.load.once(Phaser.Loader.Events.COMPLETE,finish);scene.load.on('loaderror',onError);
  scene.load.json(item.key+'-meta',BASE+item.path+'.json');scene.load.image(item.key+'-source',BASE+item.path+'.png');scene.load.start();
 }).finally(()=>scene.playerAnimationLoads.delete(id));
 scene.playerAnimationLoads.set(id,promise);return promise;
}
export default class CharacterSpriteRenderer{
 constructor(scene,{x,y,scale=DEFAULT_CHARACTER_SCALE,depthManager=scene.worldDepthManager}={}){
  this.scene=scene;this.depthManager=depthManager;this.x=x;this.y=y;this.direction=0;this.moving=false;this.movementMode=DEFAULT_MOVEMENT_ANIMATION;this.currentAnimation=null;this.actionState=new CharacterActionState();this.actionToken=null;this.nextCombatVariant=0;this.pendingActionLoads = new Set();
  this.baseScale = scale;
  this.actionScaleMultiplier = 1.35;
  this.destroyed = false;
  const ratio=scale/.62;this.shadow=scene.add.ellipse(x,y-2,22*ratio,9*ratio,0x101522,.3);this.depthManager.apply(this.shadow,y,'shadow');
  const idle=CHARACTER_ANIMATIONS[DEFAULT_IDLE_ANIMATION],key=textureKey(idle,0),pivot=scene.playerFramePivots?.get(key+':f0')??.9375;
  this.sprite=scene.add.sprite(x,y,key,'f0').setOrigin(.5,pivot).setScale(scale);this.depthManager.apply(this.sprite,y,'actor');this.playLocomotion(true);
 }
 animationKey(animation,direction=this.direction){return animation?animation.key+'-d'+direction:null;}
 setDirection(x,y){if(Math.hypot(x,y)<.0001||this.actionState.activeAction)return;const sector=Math.PI/4,angle=Math.atan2(x,y),next=((Math.round(angle/sector)%8)+8)%8;if(next===this.direction)return;this.direction=next;this.playLocomotion(true);}
 setMoving(value){const next=Boolean(value);if(this.moving===next)return;this.moving=next;if(!this.actionState.activeAction)this.playLocomotion();}
 setMovementMode(mode){if(mode!==DEFAULT_MOVEMENT_ANIMATION&&mode!==DEFAULT_FAST_MOVEMENT_ANIMATION)throw new Error('Modo de movimento desconhecido: '+mode);if(this.movementMode===mode)return;this.movementMode=mode;if(this.moving&&!this.actionState.activeAction)this.playLocomotion();}
 playLocomotion(force=false){if(this.destroyed||this.actionState.activeAction)return;const id=this.moving?this.movementMode:DEFAULT_IDLE_ANIMATION,animation=CHARACTER_ANIMATIONS[id],key=this.animationKey(animation);if(!key||!this.scene.anims.exists(key)){console.warn('[CharacterAnimations] Animação essencial não registrada:',id);return;}if(!force&&this.currentAnimation===id)return;this.currentAnimation=id;this.sprite.setScale(this.baseScale);this.sprite.play(key,true);}
 get blocksMovement(){return this.actionState.blocksMovement;}
 get activeAction(){return this.actionState.activeAction;}
 canStartAction(id){const animation=CHARACTER_ANIMATIONS[id];if(!animation||['idle','walking','running','runningVariant'].includes(id))return false;return this.actionState.canStart(id,animation);}
 playAction(actionId,overrides={}){
  if(this.destroyed)return false;
  const resolved=actionId==='combat'?COMBAT_ANIMATION_SEQUENCE[this.nextCombatVariant%COMBAT_ANIMATION_SEQUENCE.length]:actionId,animation=CHARACTER_ANIMATIONS[resolved];
  if(!animation||['idle','walking','running'].includes(resolved)){console.warn('[CharacterAnimations] Ação desconhecida:',resolved);return false;}
  const key=this.animationKey(animation);
  if(!key||!this.scene.anims.exists(key)){
   if(this.pendingActionLoads.has(resolved))return true;
   this.pendingActionLoads.add(resolved);
   loadPlayerSpriteAnimation(this.scene,resolved).then(loaded=>{this.pendingActionLoads.delete(resolved);if(loaded&&!this.destroyed)this.playAction(resolved,overrides);else console.warn('[CharacterAnimations] Falha ao carregar ação:',resolved);}).catch(error=>{this.pendingActionLoads.delete(resolved);console.error('[CharacterAnimations] Falha ao carregar ação:',resolved,error);});
   return true;
  }
  const {durationMs,...actionOverrides}=overrides,isCombat=actionId==='combat';
  const started=this.actionState.start(resolved,{...animation,...actionOverrides,...(isCombat?{priority:CHARACTER_ANIMATIONS.combat.priority,interruptible:true,lockMovement:true,restartExisting:true}:{})});
  if(!started.accepted)return false;
  this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE,this.onActionComplete,this);this.actionToken=started.action.token;this.currentAnimation=resolved;this.sprite.setScale(this.baseScale * this.actionScaleMultiplier);
  this.sprite.play({key,frameRate:Number.isFinite(durationMs)&&durationMs>0?null:undefined,repeat:animation.loop?-1:0,...(Number.isFinite(durationMs)&&durationMs>0?{duration:durationMs}:{})});
  if(!animation.loop)this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE,this.onActionComplete,this);return true;
 }
 onActionComplete(){const result=this.actionState.complete(this.actionToken);if(!result.matched)return;if(result.held){this.currentAnimation=this.actionState.activeAction;return;}this.actionToken=null;this.currentAnimation=null;this.playLocomotion(true);}
 cancelAction({force=false}={}){if(!this.actionState.cancel({force}))return false;this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE,this.onActionComplete,this);this.actionToken=null;this.currentAnimation=null;this.playLocomotion(true);return true;}
 setTransform(x,y){this.x=x;this.y=y;this.sprite.setPosition(x,y);this.shadow.setPosition(x,y-2);this.depthManager.apply(this.shadow,y,'shadow');this.depthManager.apply(this.sprite,y,'actor');}
 update(){if(this.destroyed||!this.sprite)return;const key=this.sprite.texture?.key,name=this.sprite.frame?.name,pivot=this.scene.playerFramePivots?.get(key+':'+name);if(Number.isFinite(pivot)&&Math.abs(this.sprite.originY-pivot)>.0001)this.sprite.setOrigin(.5,pivot);}
 destroy(){if(this.destroyed)return;this.destroyed=true;this.sprite?.off(Phaser.Animations.Events.ANIMATION_COMPLETE,this.onActionComplete,this);this.sprite?.destroy();this.shadow?.destroy();}
}
