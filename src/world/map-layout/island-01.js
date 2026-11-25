/**
 * Layout autoral da ilha inicial.
 *
 * As coordenadas são explícitas e estáveis: nenhuma estrutura principal
 * é distribuída aleatoriamente. A região central permanece livre para o
 * surgimento inicial e para os caminhos que conectam os quatro bosques.
 *
 * targetHeight redimensiona uniformemente a imagem, preservando a proporção.
 */
export const ISLAND_01_LAYOUT = Object.freeze([
  // Bosque noroeste
  { id: 'tree-nw-01', assetKey: 'tree-large', x: 1280, y: 1320, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-02', assetKey: 'tree-flowering', x: 1420, y: 1240, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-03', assetKey: 'tree-large', x: 1570, y: 1320, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-04', assetKey: 'tree-flowering', x: 1190, y: 1480, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-05', assetKey: 'tree-large', x: 1380, y: 1510, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-06', assetKey: 'tree-flowering', x: 1570, y: 1480, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-07', assetKey: 'tree-large', x: 1100, y: 1640, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-nw-08', assetKey: 'tree-flowering', x: 1300, y: 1690, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },

  // Bosque nordeste
  { id: 'tree-ne-01', assetKey: 'tree-large', x: 2520, y: 1240, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-02', assetKey: 'tree-flowering', x: 2700, y: 1310, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-03', assetKey: 'tree-large', x: 2880, y: 1240, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-04', assetKey: 'tree-flowering', x: 2510, y: 1470, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-05', assetKey: 'tree-large', x: 2720, y: 1510, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-06', assetKey: 'tree-flowering', x: 2920, y: 1460, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-07', assetKey: 'tree-large', x: 2610, y: 1660, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-ne-08', assetKey: 'tree-flowering', x: 2820, y: 1700, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },

  // Bosque sudoeste
  { id: 'tree-sw-01', assetKey: 'tree-large', x: 1190, y: 2440, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-02', assetKey: 'tree-flowering', x: 1380, y: 2500, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-03', assetKey: 'tree-large', x: 1570, y: 2430, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-04', assetKey: 'tree-flowering', x: 1100, y: 2650, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-05', assetKey: 'tree-large', x: 1310, y: 2720, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-06', assetKey: 'tree-flowering', x: 1530, y: 2660, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-07', assetKey: 'tree-large', x: 1220, y: 2880, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-sw-08', assetKey: 'tree-flowering', x: 1430, y: 2940, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },

  // Bosque sudeste
  { id: 'tree-se-01', assetKey: 'tree-large', x: 2520, y: 2440, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-02', assetKey: 'tree-flowering', x: 2710, y: 2500, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-03', assetKey: 'tree-large', x: 2900, y: 2430, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-04', assetKey: 'tree-flowering', x: 2530, y: 2660, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-05', assetKey: 'tree-large', x: 2740, y: 2730, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-06', assetKey: 'tree-flowering', x: 2940, y: 2660, targetHeight: 112, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-07', assetKey: 'tree-large', x: 2630, y: 2890, targetHeight: 118, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },
  { id: 'tree-se-08', assetKey: 'tree-flowering', x: 2850, y: 2940, targetHeight: 124, collision: { offsetY: -12, radiusX: 17, radiusY: 13 } },

  // Formações rochosas nos intervalos externos entre os bosques
  { id: 'rock-west-01', assetKey: 'rock-cluster', x: 1050, y: 1980, targetHeight: 82, collision: { offsetY: -8, radiusX: 30, radiusY: 20 } },
  { id: 'rock-east-01', assetKey: 'rock-cluster', x: 3040, y: 1980, targetHeight: 82, collision: { offsetY: -8, radiusX: 30, radiusY: 20 } },
  { id: 'rock-north-01', assetKey: 'rock-cluster', x: 1980, y: 1050, targetHeight: 76, collision: { offsetY: -8, radiusX: 30, radiusY: 20 } },
  { id: 'rock-south-01', assetKey: 'rock-cluster', x: 1980, y: 3040, targetHeight: 88, collision: { offsetY: -8, radiusX: 30, radiusY: 20 } }
].map((item) => Object.freeze(item)));
