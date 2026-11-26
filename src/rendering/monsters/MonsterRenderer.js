/** Renderização não participa das regras de combate. */
export default class MonsterRenderer{
 constructor(scene,monster,definition,depthManager){
  Object.assign(this,{scene,monster,definition,depthManager});this.currentState=null;this.destroyed=false;
  const visual=definition.visual,idle=visual?.animations?.idle,key=idle?.key;
  this.shadow=scene.add.ellipse(monster.x,monster.y-2,26,9,0x101522,.24);this.depthManager?.apply(this.shadow,monster.y,'shadow');
  if(key&&scene.textures.exists(key)){
   this.sprite=scene.add.image(monster.x,monster.y,key).setOrigin(visual.originX??.5,visual.originY??.92).setScale(visual.scale||1);
   this.fallback=null;
  }else{
   // Fallback gráfico simples evita o quadrado preto de textura ausente.
   this.fallback=scene.add.ellipse(monster.x,monster.y-10,25,20,0x65d96e,.95).setStrokeStyle(2,0x287b3c);
   this.sprite=null;
  }
  this.depthManager?.apply(this.sprite||this.fallback,monster.y,'actor');
 }
 play(state){
  if(this.destroyed)return;const pack=this.definition.visual?.animations?.[state],key=pack?.key;
  if(this.sprite&&key&&this.scene.textures.exists(key))this.sprite.setTexture(key);
  this.currentState=state;
 }
 setTransform(x,y){
  if(this.destroyed)return;this.sprite?.setPosition(x,y);this.fallback?.setPosition(x,y-10);this.shadow?.setPosition(x,y-2);
  this.depthManager?.apply(this.shadow,y,'shadow');this.depthManager?.apply(this.sprite||this.fallback,y,'actor');
 }
 update(){}
 destroy(){if(this.destroyed)return;this.destroyed=true;this.sprite?.destroy();this.fallback?.destroy();this.shadow?.destroy();this.scene=null;this.monster=null;this.definition=null;}
}
