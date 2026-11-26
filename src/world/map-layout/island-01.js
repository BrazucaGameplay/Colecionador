/**
 * Layout fixo da floresta da ilha inicial.
 *
 * Cada instância possui coordenadas próprias. Não existe distribuição
 * procedural ou sorteio: alterar a floresta significa editar este catálogo.
 * A origem visual fica na base (pé do tronco), preservando a profundidade Y.
 *
 * tree-forest-broad: árvore de copa larga da ilha.
 * tree-forest-pine: pinheiro da ilha.
 * tree-ancestral: exemplar único, no canto noroeste.
 */
const TREE_COLLISION = Object.freeze({
  broad: Object.freeze({ offsetY: -13, radiusX: 17, radiusY: 13 }),
  pine: Object.freeze({ offsetY: -12, radiusX: 14, radiusY: 12 }),
  ancestral: Object.freeze({ offsetY: -22, radiusX: 31, radiusY: 25 })
});

export const ISLAND_01_LAYOUT = Object.freeze([
  // Árvore ancestral única — canto noroeste da ilha.
  { id: 'tree-ancestral-nw', assetKey: 'tree-ancestral', kind: 'landmark', x: 700, y: 720, targetHeight: 430, collision: TREE_COLLISION.ancestral },

  // Bosque noroeste — copa larga e pinheiros em alturas variadas.
  { id: 'tree-nw-01', assetKey: 'tree-forest-broad', x: 1280, y: 1320, targetHeight: 208, collision: TREE_COLLISION.broad },
  { id: 'tree-nw-02', assetKey: 'tree-forest-pine', x: 1420, y: 1240, targetHeight: 224, collision: TREE_COLLISION.pine },
  { id: 'tree-nw-03', assetKey: 'tree-forest-broad', x: 1570, y: 1320, targetHeight: 184, collision: TREE_COLLISION.broad },
  { id: 'tree-nw-04', assetKey: 'tree-forest-pine', x: 1190, y: 1480, targetHeight: 196, collision: TREE_COLLISION.pine },
  { id: 'tree-nw-05', assetKey: 'tree-forest-broad', x: 1380, y: 1510, targetHeight: 232, collision: TREE_COLLISION.broad },
  { id: 'tree-nw-06', assetKey: 'tree-forest-pine', x: 1570, y: 1480, targetHeight: 212, collision: TREE_COLLISION.pine },
  { id: 'tree-nw-07', assetKey: 'tree-forest-broad', x: 1100, y: 1640, targetHeight: 190, collision: TREE_COLLISION.broad },
  { id: 'tree-nw-08', assetKey: 'tree-forest-pine', x: 1300, y: 1690, targetHeight: 230, collision: TREE_COLLISION.pine },

  // Bosque nordeste.
  { id: 'tree-ne-01', assetKey: 'tree-forest-broad', x: 2520, y: 1240, targetHeight: 214, collision: TREE_COLLISION.broad },
  { id: 'tree-ne-02', assetKey: 'tree-forest-pine', x: 2700, y: 1310, targetHeight: 236, collision: TREE_COLLISION.pine },
  { id: 'tree-ne-03', assetKey: 'tree-forest-broad', x: 2880, y: 1240, targetHeight: 188, collision: TREE_COLLISION.broad },
  { id: 'tree-ne-04', assetKey: 'tree-forest-pine', x: 2510, y: 1470, targetHeight: 202, collision: TREE_COLLISION.pine },
  { id: 'tree-ne-05', assetKey: 'tree-forest-broad', x: 2720, y: 1510, targetHeight: 228, collision: TREE_COLLISION.broad },
  { id: 'tree-ne-06', assetKey: 'tree-forest-pine', x: 2920, y: 1460, targetHeight: 218, collision: TREE_COLLISION.pine },
  { id: 'tree-ne-07', assetKey: 'tree-forest-broad', x: 2610, y: 1660, targetHeight: 194, collision: TREE_COLLISION.broad },
  { id: 'tree-ne-08', assetKey: 'tree-forest-pine', x: 2820, y: 1700, targetHeight: 232, collision: TREE_COLLISION.pine },

  // Bosque sudoeste.
  { id: 'tree-sw-01', assetKey: 'tree-forest-broad', x: 1190, y: 2440, targetHeight: 210, collision: TREE_COLLISION.broad },
  { id: 'tree-sw-02', assetKey: 'tree-forest-pine', x: 1380, y: 2500, targetHeight: 226, collision: TREE_COLLISION.pine },
  { id: 'tree-sw-03', assetKey: 'tree-forest-broad', x: 1570, y: 2430, targetHeight: 186, collision: TREE_COLLISION.broad },
  { id: 'tree-sw-04', assetKey: 'tree-forest-pine', x: 1100, y: 2650, targetHeight: 200, collision: TREE_COLLISION.pine },
  { id: 'tree-sw-05', assetKey: 'tree-forest-broad', x: 1310, y: 2720, targetHeight: 234, collision: TREE_COLLISION.broad },
  { id: 'tree-sw-06', assetKey: 'tree-forest-pine', x: 1530, y: 2660, targetHeight: 216, collision: TREE_COLLISION.pine },
  { id: 'tree-sw-07', assetKey: 'tree-forest-broad', x: 1220, y: 2880, targetHeight: 192, collision: TREE_COLLISION.broad },
  { id: 'tree-sw-08', assetKey: 'tree-forest-pine', x: 1430, y: 2940, targetHeight: 228, collision: TREE_COLLISION.pine },

  // Bosque sudeste.
  { id: 'tree-se-01', assetKey: 'tree-forest-broad', x: 2520, y: 2440, targetHeight: 212, collision: TREE_COLLISION.broad },
  { id: 'tree-se-02', assetKey: 'tree-forest-pine', x: 2710, y: 2500, targetHeight: 228, collision: TREE_COLLISION.pine },
  { id: 'tree-se-03', assetKey: 'tree-forest-broad', x: 2900, y: 2430, targetHeight: 188, collision: TREE_COLLISION.broad },
  { id: 'tree-se-04', assetKey: 'tree-forest-pine', x: 2530, y: 2660, targetHeight: 204, collision: TREE_COLLISION.pine },
  { id: 'tree-se-05', assetKey: 'tree-forest-broad', x: 2740, y: 2730, targetHeight: 236, collision: TREE_COLLISION.broad },
  { id: 'tree-se-06', assetKey: 'tree-forest-pine', x: 2940, y: 2660, targetHeight: 220, collision: TREE_COLLISION.pine },
  { id: 'tree-se-07', assetKey: 'tree-forest-broad', x: 2630, y: 2890, targetHeight: 196, collision: TREE_COLLISION.broad },
  { id: 'tree-se-08', assetKey: 'tree-forest-pine', x: 2850, y: 2940, targetHeight: 232, collision: TREE_COLLISION.pine }
].map((item) => Object.freeze(item)));
