import {MONSTER_DEFINITIONS} from '../../data/monsters/index.js';
import MonsterFactory from './MonsterFactory.js';
import MonsterSpawner from './MonsterSpawner.js';
export default class MonsterManager{
 constructor(scene,{navigation,playerBody,depthManager,spawnZones,definitions=MONSTER_DEFINITIONS,onPlayerDamage=()=>{},onKill=()=>{}}={}){
  if(!scene||!navigation||!playerBody?.object||!Array.isArray(spawnZones))throw new TypeError('MonsterManager exige Scene, navegação, corpo do jogador e zonas.');
  Object.assign(this,{scene,navigation,playerBody,definitions,onPlayerDamage,onKill});this.entries=new Map();this.destroyed=false;
  this.factory=new MonsterFactory(scene,{navigation,depthManager,getPlayer:()=>this.playerBody?.player,onAttackPlayer:(monster,damage)=>this.onPlayerDamage(monster,damage)});
  this.spawner=new MonsterSpawner({navigation,spawnZones,definitions,canSpawn:()=>true,createMonster:(d,p,z)=>this.createMonster(d,p,z),getAlive:z=>this.getAliveInZone(z),getPlayerPosition:()=>({x:this.playerBody.player.x,y:this.playerBody.player.y}),isOccupied:(p,r,z)=>this.isOccupied(p,r,z)});
  this.spawner.update(scene.time?.now||0);
 }
 createMonster(definition,point,zone){
  const entry=this.factory.create(definition,point,zone);
  this.entries.set(entry.entity.id,entry);return entry;
 }
 getAliveInZone(zoneId){return [...this.entries.values()].filter(e=>e.entity.alive&&e.entity.spawnZoneId===zoneId);}
 isOccupied(point,radius,zoneId){
  for(const e of this.getAliveInZone(zoneId)){const r=Number(e.entity.definition.collision?.radius)||12,min=radius+r+12,dx=point.x-e.entity.x,dy=point.y-e.entity.y;if(dx*dx+dy*dy<min*min)return true;}return false;
 }
 getAliveTargets(){return [...this.entries.values()].filter(e=>e.entity.alive).map(e=>e.entity);}
 isAlive(id){return Boolean(this.entries.get(id)?.entity.alive);}
 damage(id,amount=1,now=this.scene.time.now){
  const e=this.entries.get(id);if(!e||!e.entity.alive)return {applied:0,dead:false};const result=e.entity.takeDamage(amount);if(!result.dead)return result;
  e.body.setEnabled(false);e.renderer.play('death');e.removeAt=now+(Number(e.entity.definition.deathDurationMs)||600);this.spawner.notifyDeath(e.entity.spawnZoneId,now);
  this.onKill({monster:e.entity,experience:e.entity.definition.experience,drops:e.entity.definition.drops});return result;
 }
 update(now,delta){
  if(this.destroyed)return;this.spawner.update(now);
  for(const [id,e] of this.entries){if(e.entity.dead){if(now>=e.removeAt)this.remove(id);continue;}
   e.behavior.update(e.entity,now,delta);e.body.sync();e.renderer.setTransform(e.entity.x,e.entity.y);e.renderer.play(e.entity.moving?'walking':'idle');e.renderer.update();
  }
 }
 remove(id){const e=this.entries.get(id);if(!e)return false;e.collider?.destroy?.();e.body.destroy();e.renderer.destroy();e.behavior.destroy();this.entries.delete(id);return true;}
 destroy(){if(this.destroyed)return;this.destroyed=true;for(const id of [...this.entries.keys()])this.remove(id);this.spawner?.destroy();this.factory?.destroy();this.entries.clear();this.scene=null;this.navigation=null;this.playerBody=null;this.definitions=null;this.onPlayerDamage=null;this.onKill=null;}
}
