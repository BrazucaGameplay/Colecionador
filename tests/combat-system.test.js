import test from 'node:test';
import assert from 'node:assert/strict';
import CombatSystem from '../src/systems/CombatSystem.js';

function setup(){
 const player={x:0,y:0,alive:true,facing:{x:0,y:1},setFacing(x,y){const d=Math.hypot(x,y)||1;this.facing={x:x/d,y:y/d};}};
 const movement={hasManualDestination:false,auto:null,clearAutoDestination(){this.auto=null;},setAutoDestination(x,y){if(!this.hasManualDestination)this.auto={x,y};}};
 const targets=[{id:'near',x:450,y:0,alive:true},{id:'far',x:900,y:0,alive:true}];
 const attacks=[];
 const combat=new CombatSystem({player,movement,getTargets:()=>targets,onAttack:(...args)=>attacks.push(args)});
 return {player,movement,targets,attacks,combat};
}
test('persegue alvo até 2m e ataca somente dentro do raio de ataque',()=>{
 const s=setup();s.combat.update(0,16);assert.deepEqual(s.movement.auto,{x:450,y:0});
 s.targets[0].x=150;s.combat.update(500,16);assert.equal(s.movement.auto,null);assert.equal(s.attacks.length,1);
});
test('destino manual interrompe perseguição e impede ataques',()=>{
 const s=setup();s.combat.update(0,16);s.movement.hasManualDestination=true;s.combat.update(600,16);
 assert.equal(s.movement.auto,null);assert.equal(s.attacks.length,0);
});
test('ataca respeitando cooldown e escolhe alvo mais próximo',()=>{
 const s=setup();s.targets[0].x=100;s.targets[1].x=50;s.combat.update(0,16);assert.equal(s.attacks[0][0],'far');
 s.combat.update(200,16);assert.equal(s.attacks.length,1);s.combat.update(500,16);assert.equal(s.attacks.length,2);
});
test('não ataca nem persegue quando nenhum monstro está no raio de 5m',()=>{
 const s=setup();s.targets.forEach(t=>t.x=800);s.combat.update(0,16);assert.equal(s.movement.auto,null);assert.equal(s.attacks.length,0);
});
