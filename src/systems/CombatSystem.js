export const COMBAT_RULES = Object.freeze({ detectionRadius: 500, attackRadius: 200, attackCooldownMs: 500, damage: 1 });
/** Regras puras: não importa Phaser nem depende de sprites/animações. */
export default class CombatSystem {
  constructor({ player, movement, getTargets, onAttack, rules = COMBAT_RULES }) {
    if (!player || !movement || !getTargets || !onAttack) throw new TypeError('CombatSystem: dependências inválidas.');
    Object.assign(this,{player,movement,getTargets,onAttack,rules});
    this.targetId=null; this.nextAttackAt=0; this.nextPathAt=0; this.destroyed=false;
  }
  update(now) {
    if(this.destroyed||!this.player.alive)return;
    if(this.movement.hasManualDestination){this.targetId=null;this.movement.clearAutoDestination();return;}
    const targets=this.getTargets().filter(t=>t.alive);
    let target=targets.find(t=>t.id===this.targetId);
    const distance=t=>Math.hypot(t.x-this.player.x,t.y-this.player.y);
    if(!target||distance(target)>this.rules.detectionRadius*1.2){
      target=targets.map(item=>({item,d:distance(item)})).filter(x=>x.d<=this.rules.detectionRadius).sort((a,b)=>a.d-b.d)[0]?.item||null;
      this.targetId=target?.id??null;
    }
    if(!target){this.movement.clearAutoDestination();return;}
    if(distance(target)>this.rules.attackRadius){
      if(now>=this.nextPathAt){this.movement.setAutoDestination(target.x,target.y);this.nextPathAt=now+350;}
      return;
    }
    this.movement.clearAutoDestination();
    this.player.setFacing(target.x-this.player.x,target.y-this.player.y);
    if(now>=this.nextAttackAt){this.nextAttackAt=now+this.rules.attackCooldownMs;this.onAttack(target.id,this.rules.damage,now);}
  }
  destroy(){this.destroyed=true;this.movement?.clearAutoDestination();this.player=null;this.movement=null;this.getTargets=null;this.onAttack=null;}
}
