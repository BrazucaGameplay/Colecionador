/**
 * Instancia os objetos visuais definidos no layout da ilha.
 * Estruturas são imagens estáticas: não possuem lógica, animação, física,
 * input ou atualização por quadro. O Phaser cuida do culling de renderização.
 */
export default class WorldObjectManager {
  constructor(scene, { depthManager, collisionManager } = {}) {
    if (!scene?.add?.image) throw new TypeError('WorldObjectManager precisa de uma Phaser Scene.');
    if (!depthManager?.apply) throw new TypeError('WorldObjectManager precisa de WorldDepthManager.');
    if (!collisionManager?.register) throw new TypeError('WorldObjectManager precisa de WorldCollisionManager.');

    this.scene = scene;
    this.depthManager = depthManager;
    this.collisionManager = collisionManager;
    this.objects = [];
    this.ids = new Set();
    this.created = false;
  }

  create(layout) {
    if (this.created) throw new Error('O layout desta ilha já foi instanciado.');
    if (!Array.isArray(layout)) throw new TypeError('O layout da ilha precisa ser um array.');

    for (const definition of layout) {
      this.validateDefinition(definition);
      const texture = this.scene.textures.get(definition.assetKey);
      const source = texture?.getSourceImage?.();
      if (!source?.width || !source?.height) {
        throw new Error('Asset de estrutura indisponível: ' + definition.assetKey);
      }

      // Image não entra na Update List do Phaser: não executa preUpdate.
      // active=false documenta e garante que a estrutura não seja tratada
      // como entidade ativa; visible permanece true para o renderer/culling.
      const image = this.scene.add.image(definition.x, definition.y, definition.assetKey)
        .setOrigin(definition.originX ?? 0.5, definition.originY ?? 1)
        .setActive(false);

      // Escala uniforme: largura e altura mantêm sempre a proporção do PNG.
      const uniformScale = definition.targetHeight
        ? definition.targetHeight / source.height
        : (definition.scale ?? 1);
      image.setScale(uniformScale);
      if (Number.isFinite(definition.rotation)) image.setRotation(definition.rotation);

      // Profundidade e colisão são dados estáticos calculados uma única vez.
      this.depthManager.apply(image, definition.y, 'structure');
      this.collisionManager.register(definition);

      this.objects.push(image);
      this.ids.add(definition.id);
    }

    this.created = true;
    return this.objects;
  }

  validateDefinition(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new TypeError('Definição de estrutura inválida.');
    }
    if (!definition.id || this.ids.has(definition.id)) {
      throw new Error('Identificador de estrutura ausente ou duplicado: ' + (definition.id || '(vazio)'));
    }
    if (!definition.assetKey || !Number.isFinite(definition.x) || !Number.isFinite(definition.y)) {
      throw new Error('Estrutura precisa de assetKey e coordenadas válidas: ' + definition.id);
    }
    if (definition.targetHeight !== undefined && !(definition.targetHeight > 0)) {
      throw new Error('Altura visual inválida: ' + definition.id);
    }
    if (definition.scale !== undefined && !(definition.scale > 0)) {
      throw new Error('Escala inválida: ' + definition.id);
    }
  }

  destroy() {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.ids.clear();
    this.created = false;
    this.scene = null;
    this.depthManager = null;
    this.collisionManager = null;
  }
}
