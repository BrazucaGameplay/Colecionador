import { getIslandBoundaryRadius, ISLAND_SHAPE } from './IslandShape.js';
export const TERRAIN_REGIONS = Object.freeze([
  {material:'grass',x:.28,y:.28,rx:.13,ry:.09},{material:'grass',x:.69,y:.30,rx:.12,ry:.10},
  {material:'grass',x:.50,y:.50,rx:.14,ry:.10},{material:'grass',x:.31,y:.72,rx:.13,ry:.09},
  {material:'grass',x:.70,y:.70,rx:.12,ry:.09},{material:'relief',x:.48,y:.25,rx:.10,ry:.08},
  {material:'relief',x:.73,y:.51,rx:.10,ry:.08},{material:'relief',x:.31,y:.52,rx:.09,ry:.07},
  {material:'relief',x:.53,y:.76,rx:.10,ry:.07}
].map(Object.freeze));
function smoothstep(a,b,v){const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}
function ellipseMask(u,v,r){const dx=(u-r.x)/r.rx,dy=(v-r.y)/r.ry;return 1-smoothstep(.88,1.12,Math.hypot(dx,dy));}
export function getTerrainMaterialAt(u,v){
 if((u-.5)**2+(v-.5)**2>.25)return 'ocean';
 const grass=Math.max(0,...TERRAIN_REGIONS.filter(r=>r.material==='grass').map(r=>ellipseMask(u,v,r)));
 const relief=Math.max(0,...TERRAIN_REGIONS.filter(r=>r.material==='relief').map(r=>ellipseMask(u,v,r)));
 if(relief>=.5)return 'relief';if(grass>=.5)return 'grass';return 'smooth';
}
function buildMaskExpression(material){return TERRAIN_REGIONS.filter(r=>r.material===material).map(r=>'ellipseMask(uv, vec2('+r.x.toFixed(4)+', '+r.y.toFixed(4)+'), vec2('+r.rx.toFixed(4)+', '+r.ry.toFixed(4)+'))').reduce((a,b)=>a?'max('+a+', '+b+')':b,'');}
export function buildIslandTerrainShader(){return `
precision mediump float;
uniform sampler2D uSmooth;uniform sampler2D uGrass;uniform sampler2D uRelief;uniform sampler2D uShoreline;
varying vec2 outTexCoord;
float ellipseMask(vec2 p,vec2 c,vec2 r){vec2 d=(p-c)/r;return 1.0-smoothstep(.7744,1.2544,dot(d,d));}
float boundaryRadius(float a){return 1992.0+32.0*sin(a*3.0+.4)+16.0*sin(a*5.0-.9)+8.0*sin(a*8.0+.7);}
vec2 mirroredRepeat(vec2 p){vec2 c=mod(p,2.0);return 1.0-abs(c-1.0);}
void main(){
 vec2 centered=(outTexCoord-vec2(.5))*2.0;
 float radius=length(centered);
 float radiusWorld=radius*2560.0;
 float angle=atan(centered.y,centered.x);
 float coastRadius=boundaryRadius(angle);
 const float CORE_RADIUS=1660.0;

 // A textura costeira e centrada na linha de espuma; o lado azul fica fora
 // da ilha e o lado verde se sobrepoe ao terreno. 0.70 acompanha a espuma
 // da arte costeira atual; 360 unidades mapeiam a altura completa da imagem.
 float shoreU=fract(angle*.159154943+.5);
 float shoreV=.70-(radiusWorld-coastRadius)/360.0;
 vec4 shore=vec4(0.0);
 bool shoreInRange=shoreV>=0.0&&shoreV<=1.0;
 if(shoreInRange)shore=texture2D(uShoreline,vec2(shoreU,shoreV));

 // O terreno permanece continuo por toda a area caminhavel, inclusive
 // entre o nucleo circular e a costa irregular.
 if(radiusWorld<=coastRadius){
  vec2 uv=centered/(2.0*(CORE_RADIUS/2560.0))+vec2(.5);
  vec2 tileUV=mirroredRepeat(uv*4.0);
  vec3 landColor=texture2D(uSmooth,tileUV).rgb;
  if(radiusWorld>CORE_RADIUS){
   landColor=texture2D(uGrass,tileUV).rgb;
  }else{
   float grassMask=${buildMaskExpression('grass')};
   float reliefMask=${buildMaskExpression('relief')};
   if(grassMask>.001)landColor=mix(landColor,texture2D(uGrass,tileUV).rgb,grassMask);
   if(reliefMask>.001)landColor=mix(landColor,texture2D(uRelief,tileUV).rgb,reliefMask);
  }
  if(shoreInRange)landColor=mix(landColor,shore.rgb,shore.a);
  gl_FragColor=vec4(landColor,1.0);
  return;
 }

 // Fora da ilha, somente os pixels opacos da parte marinha da textura
 // costeira sao desenhados; o oceano-base continua visivel na transparencia.
 if(shoreInRange&&shore.a>.003){
  gl_FragColor=shore;
  return;
 }
 discard;
}`;}
export function createIslandTerrain(scene,{diameter=4096,smoothKey='terrain-smooth',grassKey='terrain-grass',reliefKey='terrain-relief',shorelineKey='island-shoreline'}={}){
 const renderer=scene.sys.game.renderer;
 if(renderer?.gl){
  const shader=scene.add.shader({name:'island-terrain-v2',fragmentSource:buildIslandTerrainShader(),initialUniforms:{uSmooth:0,uGrass:1,uRelief:2,uShoreline:3}},
   -(diameter*.125),-(diameter*.125),diameter*1.25,diameter*1.25,[smoothKey,grassKey,reliefKey,shorelineKey]).setOrigin(0,0).setDepth(-1000);
  return Object.freeze({object:shader,mode:'webgl-shader',drawCalls:1});
 }
 const fallback=scene.add.graphics().setDepth(-1000);
 const points=Array.from({length:160},(_,i)=>{const a=i*Math.PI*2/160,r=getIslandBoundaryRadius(a);return{x:ISLAND_SHAPE.centerX+Math.cos(a)*r,y:ISLAND_SHAPE.centerY+Math.sin(a)*r};});
 fallback.fillStyle(0x4c963b,1);fallback.fillPoints(points,true);
 return Object.freeze({object:fallback,mode:'canvas-fallback',drawCalls:1});
}
