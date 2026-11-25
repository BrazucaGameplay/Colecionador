/**
 * Ordenação vertical compartilhada por todos os objetos do mundo.
 * O ponto de apoio é a coordenada Y em que o objeto toca o chão.
 */
const DEPTH_UNIT = 100;

const ROLE_ORDER = Object.freeze({
  background: 0,
  structure: 10,
  shadow: 20,
  actor: 30,
  foreground: 40
});

export default class WorldDepthManager {
  getDepth(anchorY, role = 'actor') {
    if (!Number.isFinite(anchorY)) {
      throw new TypeError('A coordenada Y do ponto de apoio precisa ser numérica.');
    }
    const order = ROLE_ORDER[role];
    if (order === undefined) {
      throw new Error('Tipo de profundidade desconhecido: ' + role);
    }
    return anchorY * DEPTH_UNIT + order;
  }

  apply(gameObject, anchorY, role = 'actor') {
    if (!gameObject || typeof gameObject.setDepth !== 'function') {
      throw new TypeError('O objeto precisa oferecer setDepth().');
    }
    const depth = this.getDepth(anchorY, role);
    gameObject.setDepth(depth);
    return depth;
  }
}
