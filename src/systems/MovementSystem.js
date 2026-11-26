const ARRIVAL_DISTANCE=3,COLLISION_RADIUS=10,MAX_DELTA=50;
/** Tap-to-move: destinos manuais têm prioridade sobre rotas automáticas. */
export default class MovementSystem{
 constructor(player,navigation){this.player=player;this.navigation=navigation;this.route=[];this.destination=null;this.destinationMode=null;this.paused=false;}
 get hasManualDestination(){return this.destinationMode==='manual'&&Boolean(this.destination);}
 setPaused(value){this.paused=Boolean(value);if(this.paused)this.player?.setMoving(false);}
 setDestination(x,y){return this.setRoute(x,y,'manual');}
 setAutoDestination(x,y){if(this.hasManualDestination)return false;return this.setRoute(x,y,'auto');}
 setRoute(x,y,mode){
  const target=this.navigation.findNearestWalkablePoint(Math.max(0,Math.min(this.navigation.width,x)),Math.max(0,Math.min(this.navigation.height,y)));
  if(!target){if(mode==='manual')this.clearDestination();return false;}
  const path=this.navigation.findPath(this.player.x,this.player.y,target.x,target.y);
  if(!path.length){if(mode==='manual')this.clearDestination();return false;}
  this.route=path;this.destination=target;this.destinationMode=mode;return true;
 }
 clearAutoDestination(){if(this.destinationMode!=='auto')return false;this.clearDestination();return true;}
 clearDestination(){this.destination=null;this.destinationMode=null;this.route.length=0;this.player?.setMoving(false);}
 update(delta=16.67){
  if(this.paused||!this.player?.alive||!this.route.length){this.player?.setMoving(false);return;}
  let remaining=this.player.speed*Math.min(Math.max(delta,0),MAX_DELTA)/1000,mx=0,my=0;
  while(remaining>0&&this.route.length){
   const p=this.route[0],dx=p.x-this.player.x,dy=p.y-this.player.y,d=Math.hypot(dx,dy),step=Math.min(d,remaining),nx=d?dx/d:0,ny=d?dy/d:0;
   if(!this.tryMove(this.player.x+nx*step,this.player.y+ny*step)){this.clearDestination();break;}
   mx=nx;my=ny;remaining-=step;if(d<=ARRIVAL_DISTANCE||step>=d)this.route.shift();else break;
  }
  if(!this.route.length){this.clearDestination();return;}
  if(Math.hypot(mx,my)>.0001){this.player.setFacing(mx,my);this.player.setMoving(true);}else this.player.setMoving(false);
 }
 tryMove(x,y){
  if(this.navigation.isAreaWalkable(x,y,COLLISION_RADIUS)){this.player.setPosition(x,y);return true;}
  const cx=this.navigation.isAreaWalkable(x,this.player.y,COLLISION_RADIUS),cy=this.navigation.isAreaWalkable(this.player.x,y,COLLISION_RADIUS);
  if(cx&&!cy){this.player.setPosition(x,this.player.y);return true;}if(cy&&!cx){this.player.setPosition(this.player.x,y);return true;}return false;
 }
 destroy(){this.clearDestination();this.player=null;this.navigation=null;}
}
