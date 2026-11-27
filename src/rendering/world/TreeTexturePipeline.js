const TREE_FRAME='tree';
const EDGE_PADDING=2;
export function nextPowerOfTwo(value){if(!Number.isFinite(value)||value<1)throw new RangeError('Dimensão de textura inválida.');let size=1;while(size<value)size*=2;return size;}
export function createTreeTextureLayout(width,height,padding=EDGE_PADDING){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)throw new RangeError('A textura da árvore precisa ter dimensões positivas.');
 if(!Number.isInteger(padding)||padding<1)throw new RangeError('A margem de proteção precisa ser um inteiro positivo.');
 const canvasWidth=nextPowerOfTwo(width),canvasHeight=nextPowerOfTwo(height);
 const scale=Math.min(1,(canvasWidth-padding*2)/width,(canvasHeight-padding*2)/height);
 const frameWidth=Math.max(1,Math.floor(width*scale)),frameHeight=Math.max(1,Math.floor(height*scale));
 return {canvasWidth,canvasHeight,x:Math.floor((canvasWidth-frameWidth)/2),y:Math.floor((canvasHeight-frameHeight)/2),frameWidth,frameHeight,scale};
}
function drawWithExtendedEdges(context,source,p){
 const {x,y,frameWidth:fw,frameHeight:fh,canvasWidth:cw,canvasHeight:ch}=p,sw=source.width,sh=source.height;
 context.clearRect(0,0,cw,ch);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 context.drawImage(source,0,0,sw,sh,x,y,fw,fh);
 if(x)context.drawImage(source,0,0,1,sh,0,y,x,fh);
 if(x+fw<cw)context.drawImage(source,sw-1,0,1,sh,x+fw,y,cw-x-fw,fh);
 if(y)context.drawImage(source,0,0,sw,1,x,0,fw,y);
 if(y+fh<ch)context.drawImage(source,0,sh-1,sw,1,x,y+fh,fw,ch-y-fh);
 if(x&&y)context.drawImage(source,0,0,1,1,0,0,x,y);
 if(x+fw<cw&&y)context.drawImage(source,sw-1,0,1,1,x+fw,0,cw-x-fw,y);
 if(x&&y+fh<ch)context.drawImage(source,0,sh-1,1,1,0,y+fh,x,ch-y-fh);
 if(x+fw<cw&&y+fh<ch)context.drawImage(source,sw-1,sh-1,1,1,x+fw,y+fh,cw-x-fw,ch-y-fh);
}
export default class TreeTexturePipeline{
 constructor(scene){if(!scene?.textures?.get||!scene?.textures?.addCanvas)throw new TypeError('TreeTexturePipeline precisa do TextureManager do Phaser.');this.scene=scene;}
 prepare(keys){
  if(!Array.isArray(keys)||!keys.length)throw new TypeError('Informe as texturas de árvores.');
  const profiles={},renderer=this.scene.game?.renderer||this.scene.sys?.game?.renderer;
  const previous=renderer?.mipmapFilter, mipmapFilter=renderer?.gl?.LINEAR_MIPMAP_NEAREST;
  try{
   // Usa mipmaps com seleção do nível mais próximo: mantém antialiasing
   // dentro do nível, sem interpolar dois níveis e suavizar detalhes finos.
   if(renderer?.gl && Number.isFinite(mipmapFilter))renderer.mipmapFilter=mipmapFilter;
   for(const key of keys){
    const original=this.scene.textures.get(key),source=original?.getSourceImage?.();
    if(!source?.width||!source?.height)throw new Error('Textura de árvore indisponível: '+key);
    const p=createTreeTextureLayout(source.width,source.height),canvas=document.createElement('canvas');
    canvas.width=p.canvasWidth;canvas.height=p.canvasHeight;
    const context=canvas.getContext('2d');if(!context)throw new Error('Não foi possível preparar a textura: '+key);
    drawWithExtendedEdges(context,source,p);
    this.scene.textures.remove(key);
    const texture=this.scene.textures.addCanvas(key,canvas);
    if(!texture)throw new Error('Não foi possível registrar a textura preparada: '+key);
    texture.add(TREE_FRAME,0,p.x,p.y,p.frameWidth,p.frameHeight);
    profiles[key]=Object.freeze({sourceWidth:source.width,sourceHeight:source.height,canvasWidth:p.canvasWidth,canvasHeight:p.canvasHeight,frameWidth:p.frameWidth,frameHeight:p.frameHeight,mipmapsEnabled:Boolean(renderer?.gl && Number.isFinite(mipmapFilter)),minificationFilter:renderer?.gl && Number.isFinite(mipmapFilter)?'LINEAR_MIPMAP_NEAREST':'LINEAR'});
   }
  }finally{if(renderer)renderer.mipmapFilter=previous;}
  return Object.freeze(profiles);
 }
}
