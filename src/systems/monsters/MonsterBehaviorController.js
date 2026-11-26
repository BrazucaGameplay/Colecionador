const DETECTION_RADIUS=400,ATTACK_RADIUS=150,LEASH_RADIUS=1000,ATTACK_COOLDOWN=1200;
/** IA lógica do monstro; perseguição, colisão de navegação e dano independem de arte. */
export default class MonsterBehaviorController{
 constructor({navigation,zone,definition,getPlayer,onAttackPlayer,random=Math.random}){
  Object.assign(this,{navigation,zone,definition,getPlayer,onAttackPlayer,random});this.vx=0;this.vy=0;this.nextDecisionAt=0;this.nextAttackAt=0;
 }
 moveToward(monster,target,delta){
  const dx=target.x-monster.x,dy=target.y-monster.y,d=Math.hypot(dx,dy);if(d<1){monster.setMoving(false);return;}
  const step=Math.min(d,this.definition.speed*Math.min(Math.max(delta,0),50)/1000),nx=dx/d,ny=dy/d;
  let x=monster.x+nx*step,y=monster.y+ny*step;
  if(!this.navigation.isAreaWalkable(x,y,this.definition.collision?.radius||12)){
   const path=this.navigation.findPath(monster.x,monster.y,target.x,target.y),p=path[0];if(!p){monster.setMoving(false);return;}
   const wx=p.x-monster.x,wy=p.y-monster.y,wd=Math.hypot(wx,wy)||1;x=monster.x+wx/wd*step;y=monster.y+wy/wd*step;
   if(!this.navigation.isAreaWalkable(x,y,this.definition.collision?.radius||12)){monster.setMoving(false);return;}
  }
  monster.setPosition(x,y);monster.setFacing(nx,ny);monster.setMoving(true);
 }
 update(monster,now,delta){
  if(!monster?.alive)return;const player=this.getPlayer?.(),d=player?.alive?Math.hypot(player.x-monster.x,player.y-monster.y):Infinity;
  if(d<=DETECTION_RADIUS){
   if(d<=ATTACK_RADIUS){monster.setMoving(false);monster.setFacing(player.x-monster.x,player.y-monster.y);if(now>=this.nextAttackAt){this.nextAttackAt=now+ATTACK_COOLDOWN;this.onAttackPlayer?.(monster,Number(this.definition.contactDamage)||1);}}
   else this.moveToward(monster,player,delta);
   return;
  }
  if(Math.hypot(this.zone.x-monster.x,this.zone.y-monster.y)>24){this.moveToward(monster,this.zone,delta);return;}
  if(now>=this.nextDecisionAt){const b=this.definition.behavior||{},min=Number(b.decisionMinMs)||800,max=Math.max(min,Number(b.decisionMaxMs)||1600);if(this.random()<Number(b.moveChance??.7)){const a=this.random()*Math.PI*2;this.vx=Math.cos(a)*this.definition.speed;this.vy=Math.sin(a)*this.definition.speed;}else this.vx=this.vy=0;this.nextDecisionAt=now+min+this.random()*(max-min);}
  if(!this.vx&&!this.vy){monster.setMoving(false);return;}
  const s=Math.min(Math.max(delta,0),50)/1000,x=monster.x+this.vx*s,y=monster.y+this.vy*s,dx=x-this.zone.x,dy=y-this.zone.y,r=Math.max(0,this.zone.radius-(this.definition.collision?.radius||12));
  if(dx*dx+dy*dy>r*r||!this.navigation.isAreaWalkable(x,y,this.definition.collision?.radius||12)){this.vx=this.vy=0;monster.setMoving(false);return;}
  monster.setPosition(x,y);monster.setFacing(this.vx,this.vy);monster.setMoving(true);
 }
 destroy(){this.navigation=null;this.zone=null;this.definition=null;this.getPlayer=null;this.onAttackPlayer=null;}
}
