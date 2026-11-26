/** Zonas de spawn da ilha. A zona central garante encontro logo no início. */
const zone=(id,x,y,maxAlive=2)=>Object.freeze({id,speciesId:'slime',x,y,radius:110,maxAlive,minPlayerDistance:0,collisionRadius:12,respawnMs:12000,retryMs:1500,spawnIntervalMs:0,enabled:true});
export const ISLAND_01_MONSTER_SPAWNS=Object.freeze([
 zone('slime-start',2048,1780,2),
 zone('slime-nw',940,1450),zone('slime-ne',3150,1450),zone('slime-sw',940,2650),zone('slime-se',3150,2650)
]);
