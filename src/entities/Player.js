export const DEFAULT_PLAYER_STATS=Object.freeze({attack:5,defense:0,penetration:0,attackSpeed:1,movementSpeed:1,maxHealth:100,maxEnergy:100,healthRegen:1,energyRegen:2});
export const STAT_UPGRADES=Object.freeze({
 attack:{label:'Ataque',amount:1,format:v=>String(v)},defense:{label:'Defesa',amount:1,format:v=>String(v)},penetration:{label:'Penetração',amount:1,format:v=>String(v)},
 attackSpeed:{label:'Velocidade de ataque',amount:.1,format:v=>v.toFixed(2)+'/s'},movementSpeed:{label:'Velocidade de movimento',amount:.05,format:v=>v.toFixed(2)+'x'},
 maxHealth:{label:'Vida máxima',amount:10,format:v=>String(v)},maxEnergy:{label:'Energia máxima',amount:10,format:v=>String(v)},
 healthRegen:{label:'Recuperação de vida',amount:.5,format:v=>v.toFixed(2)+'/s'},energyRegen:{label:'Recuperação de energia',amount:.5,format:v=>v.toFixed(2)+'/s'}
});
const safe=(v,d)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):d;
export default class Player{
 constructor({x=0,y=0,speed=220,saveData=null}={}){
  const s=saveData&&typeof saveData==='object'?saveData:{},saved=s.stats&&typeof s.stats==='object'?s.stats:{};
  this.x=Number(x)||0;this.y=Number(y)||0;this.baseSpeed=safe(speed,220);
  this.stats=Object.fromEntries(Object.entries(DEFAULT_PLAYER_STATS).map(([k,v])=>[k,safe(saved[k],v)]));
  this.level=Math.max(1,Math.floor(safe(s.level,1)));this.experience=safe(s.experience,0);this.statPoints=Math.floor(safe(s.statPoints,0));
  this.maxHealth=this.stats.maxHealth;this.maxEnergy=this.stats.maxEnergy;
  this.health=Math.min(this.maxHealth,safe(s.health,this.maxHealth));this.energy=Math.min(this.maxEnergy,safe(s.energy,this.maxEnergy));
  this.alive=this.health>0;this.moving=false;this.inCombatUntil=0;this.facing={x:0,y:1};
 }
 get speed(){return this.baseSpeed*this.stats.movementSpeed;}
 setPosition(x,y){this.x=x;this.y=y;}
 setFacing(x,y){const l=Math.hypot(x,y);if(l>.0001)this.facing={x:x/l,y:y/l};}
 setMoving(v){this.moving=this.alive&&Boolean(v);}
 markCombat(now,duration=5000){this.inCombatUntil=Math.max(this.inCombatUntil,Number(now)+duration);}
 isInCombat(now){return Number(now)<this.inCombatUntil;}
 takeDamage(amount=1,now=0,penetration=0){if(!this.alive)return{applied:0,health:this.health,dead:true};const effectiveDefense=Math.max(0,this.stats.defense-Math.max(0,safe(penetration,0)));const applied=Math.max(0,safe(amount,0)-effectiveDefense);if(!applied)return{applied:0,health:this.health,dead:false};this.markCombat(now);this.health=Math.max(0,this.health-applied);if(!this.health){this.alive=false;this.moving=false;}return{applied,health:this.health,dead:!this.alive};}
 restoreHealth(a=this.maxHealth){this.health=Math.min(this.maxHealth,this.health+safe(a,0));this.alive=this.health>0;return this.health;}
 restoreEnergy(a=this.maxEnergy){this.energy=Math.min(this.maxEnergy,this.energy+safe(a,0));return this.energy;}
 spendEnergy(a=0){a=safe(a,0);if(this.energy<a)return false;this.energy-=a;return true;}
 getAttackDamage(def=0){return Math.max(1,Math.floor(this.stats.attack-Math.max(0,safe(def,0)-this.stats.penetration)));}
 allocateStat(k){const u=STAT_UPGRADES[k];if(!u||this.statPoints<1)return false;this.stats[k]+=u.amount;if(k==='maxHealth'){this.maxHealth=this.stats[k];this.health=Math.min(this.maxHealth,this.health+u.amount);}if(k==='maxEnergy'){this.maxEnergy=this.stats[k];this.energy=Math.min(this.maxEnergy,this.energy+u.amount);}this.statPoints--;return true;}
 update(delta=16.67,now=0){if(!this.alive)return;const s=Math.min(Math.max(Number(delta)||0,0),100)/1000;if(!s)return;if(!this.isInCombat(now))this.health=Math.min(this.maxHealth,this.health+this.stats.healthRegen*s);this.energy=Math.min(this.maxEnergy,this.energy+this.stats.energyRegen*s);}
 toSaveData(){return{level:this.level,experience:this.experience,statPoints:this.statPoints,stats:{...this.stats},health:this.health,energy:this.energy};}
}