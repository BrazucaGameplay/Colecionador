/**
 * Instancia objetos visuais estáticos definidos no layout da ilha.
 * Não possuem lógica, animação, física, input ou atualização por quadro.
 */
export default class WorldObjectManager{
 constructor(scene,{depthManager,collisionManager}={}){
  if(!scene?.add?.image)throw new TypeError('WorldObjectManager precisa de uma Phaser Scene.');
  if(!depthManager?.apply)throw new TypeError('WorldObjectManager precisa de WorldDepthManager.');
  if(!collisionManager?.register)throw new TypeError('WorldObjectManager precisa de WorldCollisionManager.');
  this.scene=scene;this.depthManager=depthManager;this.collisionManager=collisionManager;this.objects=[];this.ids=new Set();this.created=false;
 }
 create(layout){
  if(this.created)throw new Error('O layout desta ilha já foi instanciado.');
  if(!Array.isArray(layout))throw new TypeError('O layout da ilha precisa ser um array.');
  for(const definition of layout){
   this.validateDefinition(definition);
   const texture=this.scene.textures.get(definition.assetKey),frame=texture?.frames?.tree,source=frame||texture?.getSourceImage?.();
   if(!source?.width||!source?.height)throw new Error('Asset de estrutura indisponível: '+definition.assetKey);
   const image=this.scene.add.image(definition.x,definition.y,definition.assetKey,frame?'tree':undefined).setOrigin(definition.originX??0.5,definition.originY??1).setActive(false);
   image.setScale(definition.targetHeight?definition.targetHeight/source.height:(definition.scale??1));
   if(Number.isFinite(definition.rotation))image.setRotation(definition.rotation);
   this.depthManager.apply(image,definition.y,'structure');this.collisionManager.register(definition);this.objects.push(image);this.ids.add(definition.id);
  }
  this.created=true;return this.objects;
 }
 validateDefinition(d){
  if(!d||typeof d!=='object')throw new TypeError('Definição de estrutura inválida.');
  if(!d.id||this.ids.has(d.id))throw new Error('Identificador de estrutura ausente ou duplicado: '+(d.id||'(vazio)'));
  if(!d.assetKey||!Number.isFinite(d.x)||!Number.isFinite(d.y))throw new Error('Estrutura precisa de assetKey e coordenadas válidas: '+d.id);
  if(d.targetHeight!==undefined&&!(d.targetHeight>0))throw new Error('Altura visual inválida: '+d.id);
  if(d.scale!==undefined&&!(d.scale>0))throw new Error('Escala inválida: '+d.id);
 }
 destroy(){for(const object of this.objects)object.destroy();this.objects.length=0;this.ids.clear();this.created=false;this.scene=null;this.depthManager=null;this.collisionManager=null;}
}
