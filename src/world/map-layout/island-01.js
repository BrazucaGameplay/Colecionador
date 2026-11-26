/**
 * Floresta da ilha inicial — layout manual em coordenadas do mundo (4096x4096).
 *
 * Três bosques compactos, distribuídos por regiões distintas do terreno.
 * As coordenadas de cada árvore são explícitas e nunca sorteadas.
 * A árvore ancestral fica no ponto cardeal norte (12 horas / topo do mapa),
 * afastada da faixa externa de nuvens e da borda da ilha.
 */
const TREE_COLLISION = Object.freeze({
  broad: Object.freeze({ offsetY: -14, radiusX: 31, radiusY: 28 }),
  pine: Object.freeze({ offsetY: -13, radiusX: 29, radiusY: 27 }),
  ancestral: Object.freeze({ offsetY: -24, radiusX: 38, radiusY: 32 })
});

export const ISLAND_01_LAYOUT = Object.freeze([
  // Marco único no topo da ilha: norte, equivalente à posição de 90°/12 horas.
  { id: 'tree-ancestral-north', assetKey: 'tree-ancestral', kind: 'landmark', x: 2048, y: 540, targetHeight: 430, collision: TREE_COLLISION.ancestral },

  // BOSQUE 1 — oeste/noroeste: 11 árvores próximas, sem corredor interno.
  { id: 'tree-west-01', group: 'grove-west', assetKey: 'tree-forest-broad', x: 920, y: 1360, targetHeight: 218, collision: TREE_COLLISION.broad },
  { id: 'tree-west-02', group: 'grove-west', assetKey: 'tree-forest-pine', x: 980, y: 1360, targetHeight: 230, collision: TREE_COLLISION.pine },
  { id: 'tree-west-03', group: 'grove-west', assetKey: 'tree-forest-broad', x: 1040, y: 1360, targetHeight: 194, collision: TREE_COLLISION.broad },
  { id: 'tree-west-04', group: 'grove-west', assetKey: 'tree-forest-pine', x: 1100, y: 1360, targetHeight: 220, collision: TREE_COLLISION.pine },
  { id: 'tree-west-05', group: 'grove-west', assetKey: 'tree-forest-pine', x: 900, y: 1420, targetHeight: 206, collision: TREE_COLLISION.pine },
  { id: 'tree-west-06', group: 'grove-west', assetKey: 'tree-forest-broad', x: 960, y: 1420, targetHeight: 236, collision: TREE_COLLISION.broad },
  { id: 'tree-west-07', group: 'grove-west', assetKey: 'tree-forest-pine', x: 1020, y: 1420, targetHeight: 214, collision: TREE_COLLISION.pine },
  { id: 'tree-west-08', group: 'grove-west', assetKey: 'tree-forest-broad', x: 1080, y: 1420, targetHeight: 224, collision: TREE_COLLISION.broad },
  { id: 'tree-west-09', group: 'grove-west', assetKey: 'tree-forest-broad', x: 930, y: 1480, targetHeight: 202, collision: TREE_COLLISION.broad },
  { id: 'tree-west-10', group: 'grove-west', assetKey: 'tree-forest-pine', x: 990, y: 1480, targetHeight: 232, collision: TREE_COLLISION.pine },
  { id: 'tree-west-11', group: 'grove-west', assetKey: 'tree-forest-broad', x: 1050, y: 1480, targetHeight: 212, collision: TREE_COLLISION.broad },

  // BOSQUE 2 — leste/nordeste: 11 árvores próximas.
  { id: 'tree-east-01', group: 'grove-east', assetKey: 'tree-forest-pine', x: 2940, y: 1360, targetHeight: 226, collision: TREE_COLLISION.pine },
  { id: 'tree-east-02', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3000, y: 1360, targetHeight: 210, collision: TREE_COLLISION.broad },
  { id: 'tree-east-03', group: 'grove-east', assetKey: 'tree-forest-pine', x: 3060, y: 1360, targetHeight: 238, collision: TREE_COLLISION.pine },
  { id: 'tree-east-04', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3120, y: 1360, targetHeight: 196, collision: TREE_COLLISION.broad },
  { id: 'tree-east-05', group: 'grove-east', assetKey: 'tree-forest-broad', x: 2920, y: 1420, targetHeight: 220, collision: TREE_COLLISION.broad },
  { id: 'tree-east-06', group: 'grove-east', assetKey: 'tree-forest-pine', x: 2980, y: 1420, targetHeight: 204, collision: TREE_COLLISION.pine },
  { id: 'tree-east-07', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3040, y: 1420, targetHeight: 234, collision: TREE_COLLISION.broad },
  { id: 'tree-east-08', group: 'grove-east', assetKey: 'tree-forest-pine', x: 3100, y: 1420, targetHeight: 216, collision: TREE_COLLISION.pine },
  { id: 'tree-east-09', group: 'grove-east', assetKey: 'tree-forest-pine', x: 2950, y: 1480, targetHeight: 228, collision: TREE_COLLISION.pine },
  { id: 'tree-east-10', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3010, y: 1480, targetHeight: 198, collision: TREE_COLLISION.broad },
  { id: 'tree-east-11', group: 'grove-east', assetKey: 'tree-forest-pine', x: 3070, y: 1480, targetHeight: 232, collision: TREE_COLLISION.pine },

  // BOSQUE 3 — sul/centro: 10 árvores em bloco compacto.
  { id: 'tree-south-01', group: 'grove-south', assetKey: 'tree-forest-broad', x: 1940, y: 3000, targetHeight: 220, collision: TREE_COLLISION.broad },
  { id: 'tree-south-02', group: 'grove-south', assetKey: 'tree-forest-pine', x: 2000, y: 3000, targetHeight: 234, collision: TREE_COLLISION.pine },
  { id: 'tree-south-03', group: 'grove-south', assetKey: 'tree-forest-broad', x: 2060, y: 3000, targetHeight: 202, collision: TREE_COLLISION.broad },
  { id: 'tree-south-04', group: 'grove-south', assetKey: 'tree-forest-pine', x: 2120, y: 3000, targetHeight: 226, collision: TREE_COLLISION.pine },
  { id: 'tree-south-05', group: 'grove-south', assetKey: 'tree-forest-pine', x: 1910, y: 3060, targetHeight: 210, collision: TREE_COLLISION.pine },
  { id: 'tree-south-06', group: 'grove-south', assetKey: 'tree-forest-broad', x: 1970, y: 3060, targetHeight: 238, collision: TREE_COLLISION.broad },
  { id: 'tree-south-07', group: 'grove-south', assetKey: 'tree-forest-pine', x: 2030, y: 3060, targetHeight: 218, collision: TREE_COLLISION.pine },
  { id: 'tree-south-08', group: 'grove-south', assetKey: 'tree-forest-broad', x: 2090, y: 3060, targetHeight: 230, collision: TREE_COLLISION.broad },
  { id: 'tree-south-09', group: 'grove-south', assetKey: 'tree-forest-broad', x: 2000, y: 3120, targetHeight: 206, collision: TREE_COLLISION.broad },
  { id: 'tree-south-10', group: 'grove-south', assetKey: 'tree-forest-pine', x: 2060, y: 3120, targetHeight: 232, collision: TREE_COLLISION.pine }
].map((item) => Object.freeze(item)));
