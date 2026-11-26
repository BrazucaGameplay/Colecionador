import Monster from '../../entities/Monster.js';
import MonsterBodyAdapter from '../../entities/MonsterBodyAdapter.js';
import MonsterRenderer from '../../rendering/monsters/MonsterRenderer.js';
import MonsterBehaviorController from './MonsterBehaviorController.js';
export default class MonsterFactory{
 constructor(scene,{navigation,depthManager,getPlayer,onAttackPlayer}={}){Object.assign(this,{scene,navigation,depthManager,getPlayer,onAttackPlayer});this.sequence=0;}
 create(definition,point,zone){
  const id=definition.id+'-'+zone.id+'-'+(++this.sequence),entity=new Monster({id,speciesId:definition.id,x:point.x,y:point.y,definition,spawnZoneId:zone.id});
  const body=new MonsterBodyAdapter(this.scene,entity,definition.collision),renderer=new MonsterRenderer(this.scene,entity,definition,this.depthManager);
  const behavior=new MonsterBehaviorController({navigation:this.navigation,zone,definition,getPlayer:this.getPlayer,onAttackPlayer:this.onAttackPlayer});
  return {entity,body,renderer,behavior,collider:null,removeAt:null};
 }
 destroy(){this.scene=null;this.navigation=null;this.depthManager=null;this.getPlayer=null;this.onAttackPlayer=null;this.sequence=0;}
}
