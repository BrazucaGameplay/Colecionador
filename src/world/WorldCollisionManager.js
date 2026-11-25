/**
 * Converte as áreas físicas declaradas no layout em obstáculos de navegação.
 * A colisão é independente do tamanho visual do PNG.
 */
export default class WorldCollisionManager {
  constructor(navigation) {
    if (!navigation || typeof navigation.addObstacle !== 'function') {
      throw new TypeError('WorldCollisionManager precisa de WorldNavigation.');
    }
    this.navigation = navigation;
    this.registeredIds = new Set();
    this.registrations = [];
  }

  register(definition) {
    if (!definition?.id) throw new Error('Estrutura sem identificador.');
    if (this.registeredIds.has(definition.id)) {
      throw new Error('Colisão duplicada para a estrutura: ' + definition.id);
    }

    const shape = definition.collision;
    if (!shape) return false;

    const radiusX = Number(shape.radiusX);
    const radiusY = Number(shape.radiusY ?? shape.radiusX);
    if (!(radiusX > 0) || !(radiusY > 0)) {
      throw new Error('Colisão inválida na estrutura: ' + definition.id);
    }

    const x = definition.x + (Number(shape.offsetX) || 0);
    const y = definition.y + (Number(shape.offsetY) || 0);
    this.navigation.addObstacle(x, y, radiusX, radiusY);
    this.registeredIds.add(definition.id);
    this.registrations.push({ id: definition.id, x, y, radiusX, radiusY });
    return true;
  }

  destroy() {
    this.registeredIds.clear();
    this.registrations.length = 0;
    this.navigation = null;
  }
}
