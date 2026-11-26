const image=(id,file)=>Object.freeze({id,key:'monster-slime-'+id,path:'assets/monsters/slime/'+file});
const slimeAnimations=Object.freeze({
 idle:image('idle','parado_01.webp'),
 walking:image('walking','slime_movimento_frame_02_webp.webp'),
 attack:image('attack','slime_ataque_frame_02(1).webp'),
 death:image('death','slime_morte_frame_02.webp')
});
export const MONSTER_DEFINITIONS=Object.freeze({slime:Object.freeze({
 id:'slime',name:'Slime',maxHealth:2,speed:100,defense:0,contactDamage:1,experience:0,drops:Object.freeze([]),
 collision:Object.freeze({radius:12}),deathDurationMs:600,
 behavior:Object.freeze({moveChance:.7,decisionMinMs:800,decisionMaxMs:1600}),
 visual:Object.freeze({enabled:true,scale:.55,originX:.5,originY:.92,animations:slimeAnimations})
})});
export function getMonsterDefinition(id){return MONSTER_DEFINITIONS[id]||null;}
