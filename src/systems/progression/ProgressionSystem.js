export default class ProgressionSystem{
 constructor({statPointsPerLevel=3,onLevelUp=()=>{}}={}){this.statPointsPerLevel=Math.max(1,Math.floor(Number(statPointsPerLevel)||3));this.onLevelUp=onLevelUp;}
 getRequiredExperience(level=1){return Math.floor(100*Math.pow(Math.max(1,Math.floor(Number(level)||1)),1.5));}
 award(player,amount=0){if(!player)return{gained:0,levelsGained:0};const gained=Math.max(0,Math.floor(Number(amount)||0));player.experience+=gained;let levelsGained=0;
 while(player.experience>=this.getRequiredExperience(player.level)){player.experience-=this.getRequiredExperience(player.level);player.level++;player.statPoints+=this.statPointsPerLevel;player.restoreHealth();player.restoreEnergy();levelsGained++;this.onLevelUp({player,level:player.level,statPoints:this.statPointsPerLevel});}
 return{gained,levelsGained,level:player.level};}
}