/**
 * Floresta fixa da ilha inicial — coordenadas do mundo 4096 x 4096.
 *
 * Escala de referência: alcance de ataque de 150 unidades ~= 5 m.
 * Distância máxima entre centros de árvores: 300 unidades ~= 10 m.
 * Todas as coordenadas e escalas são declaradas no catálogo; sem RNG.
 *
 * Mantém três bosques pequenos e adiciona árvores solitárias por toda a
 * superfície jogável. As colisões representam troncos e escalam junto com
 * as árvores ampliadas, sem transformar a copa inteira em obstáculo.
 */
const TREE_COLLISION_ANCESTRAL = Object.freeze({ offsetY: -36, radiusX: 57, radiusY: 48 });

export const TREE_SPACING = Object.freeze({
  worldUnitsPerMeter: 30,
  maxNeighborMeters: 10,
  maxNeighborWorldUnits: 300
});

export const ISLAND_01_LAYOUT = Object.freeze([
  { id: 'tree-ancestral-north', assetKey: 'tree-ancestral', kind: 'landmark', x: 2048, y: 540, targetHeight: 645, sizeTier: 'landmark', collision: TREE_COLLISION_ANCESTRAL },
  { id: 'tree-west-01', group: 'grove-west', assetKey: 'tree-forest-broad', x: 920, y: 1360, targetHeight: 218, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-west-03', group: 'grove-west', assetKey: 'tree-forest-broad', x: 1040, y: 1360, targetHeight: 194, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-west-06', group: 'grove-west', assetKey: 'tree-forest-broad', x: 960, y: 1420, targetHeight: 425, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-west-07', group: 'grove-west', assetKey: 'tree-forest-pine', x: 1020, y: 1420, targetHeight: 214, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-west-09', group: 'grove-west', assetKey: 'tree-forest-broad', x: 930, y: 1480, targetHeight: 202, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-west-10', group: 'grove-west', assetKey: 'tree-forest-pine', x: 990, y: 1480, targetHeight: 232, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-east-01', group: 'grove-east', assetKey: 'tree-forest-pine', x: 2940, y: 1360, targetHeight: 226, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-east-02', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3000, y: 1360, targetHeight: 210, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-east-04', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3120, y: 1360, targetHeight: 196, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-east-05', group: 'grove-east', assetKey: 'tree-forest-broad', x: 2920, y: 1420, targetHeight: 396, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-east-07', group: 'grove-east', assetKey: 'tree-forest-broad', x: 3040, y: 1420, targetHeight: 445, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-27,"radiusX":59,"radiusY":53}) },
  { id: 'tree-east-09', group: 'grove-east', assetKey: 'tree-forest-pine', x: 2950, y: 1480, targetHeight: 228, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-east-11', group: 'grove-east', assetKey: 'tree-forest-pine', x: 3070, y: 1480, targetHeight: 232, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-south-01', group: 'grove-south', assetKey: 'tree-forest-broad', x: 1940, y: 3000, targetHeight: 220, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-south-03', group: 'grove-south', assetKey: 'tree-forest-broad', x: 2060, y: 3000, targetHeight: 202, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-south-05', group: 'grove-south', assetKey: 'tree-forest-pine', x: 1910, y: 3060, targetHeight: 210, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-south-06', group: 'grove-south', assetKey: 'tree-forest-broad', x: 1970, y: 3060, targetHeight: 452, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-27,"radiusX":59,"radiusY":53}) },
  { id: 'tree-south-08', group: 'grove-south', assetKey: 'tree-forest-broad', x: 2090, y: 3060, targetHeight: 230, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-south-10', group: 'grove-south', assetKey: 'tree-forest-pine', x: 2060, y: 3120, targetHeight: 232, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-008', assetKey: 'tree-forest-pine', x: 1658, y: 472, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-015', assetKey: 'tree-forest-broad', x: 1528, y: 697, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-016', assetKey: 'tree-forest-pine', x: 1788, y: 697, targetHeight: 435, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-25,"radiusX":55,"radiusY":51}) },
  { id: 'tree-solo-020', assetKey: 'tree-forest-pine', x: 3088, y: 697, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-023', assetKey: 'tree-forest-broad', x: 878, y: 922, targetHeight: 371, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-solo-026', assetKey: 'tree-forest-pine', x: 1658, y: 922, targetHeight: 409, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-25,"radiusX":55,"radiusY":51}) },
  { id: 'tree-solo-028', assetKey: 'tree-forest-pine', x: 2178, y: 922, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-030', assetKey: 'tree-forest-pine', x: 2698, y: 922, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-035', assetKey: 'tree-forest-broad', x: 748, y: 1147, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-036', assetKey: 'tree-forest-pine', x: 1008, y: 1147, targetHeight: 435, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-25,"radiusX":55,"radiusY":51}) },
  { id: 'tree-solo-040', assetKey: 'tree-forest-pine', x: 2048, y: 1147, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-041', assetKey: 'tree-forest-broad', x: 2308, y: 1147, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-045', assetKey: 'tree-forest-broad', x: 3348, y: 1147, targetHeight: 361, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-27,"radiusX":59,"radiusY":53}) },
  { id: 'tree-solo-048', assetKey: 'tree-forest-pine', x: 618, y: 1373, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-051', assetKey: 'tree-forest-broad', x: 1918, y: 1373, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-053', assetKey: 'tree-forest-broad', x: 2438, y: 1373, targetHeight: 342, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-solo-058', assetKey: 'tree-forest-pine', x: 488, y: 1598, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-060', assetKey: 'tree-forest-pine', x: 1268, y: 1598, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-063', assetKey: 'tree-forest-broad', x: 2048, y: 1598, targetHeight: 371, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-solo-065', assetKey: 'tree-forest-broad', x: 2568, y: 1598, targetHeight: 361, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-27,"radiusX":59,"radiusY":53}) },
  { id: 'tree-solo-066', assetKey: 'tree-forest-pine', x: 3348, y: 1598, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-071', assetKey: 'tree-forest-broad', x: 878, y: 1823, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-073', assetKey: 'tree-forest-broad', x: 1398, y: 1823, targetHeight: 342, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },

  { id: 'tree-solo-078', assetKey: 'tree-forest-pine', x: 2698, y: 1823, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-080', assetKey: 'tree-forest-pine', x: 3218, y: 1823, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-083', assetKey: 'tree-forest-broad', x: 228, y: 2048, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-085', assetKey: 'tree-forest-broad', x: 748, y: 2048, targetHeight: 361, sizeTier: 'plus-90', collision: Object.freeze({"offsetY":-27,"radiusX":59,"radiusY":53}) },
  { id: 'tree-solo-088', assetKey: 'tree-forest-pine', x: 1528, y: 2048, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-093', assetKey: 'tree-forest-broad', x: 2828, y: 2048, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-096', assetKey: 'tree-forest-pine', x: 3608, y: 2048, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-098', assetKey: 'tree-forest-pine', x: 358, y: 2273, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-101', assetKey: 'tree-forest-broad', x: 1138, y: 2273, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-103', assetKey: 'tree-forest-broad', x: 1658, y: 2273, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-106', assetKey: 'tree-forest-pine', x: 2438, y: 2273, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-110', assetKey: 'tree-forest-pine', x: 3478, y: 2273, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-111', assetKey: 'tree-forest-broad', x: 3738, y: 2273, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-115', assetKey: 'tree-forest-broad', x: 1008, y: 2498, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-116', assetKey: 'tree-forest-pine', x: 1268, y: 2498, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-120', assetKey: 'tree-forest-pine', x: 2308, y: 2498, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-121', assetKey: 'tree-forest-broad', x: 2568, y: 2498, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-125', assetKey: 'tree-forest-broad', x: 3608, y: 2498, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-128', assetKey: 'tree-forest-pine', x: 618, y: 2723, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-131', assetKey: 'tree-forest-broad', x: 1398, y: 2723, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-133', assetKey: 'tree-forest-broad', x: 1918, y: 2723, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-136', assetKey: 'tree-forest-pine', x: 2698, y: 2723, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-138', assetKey: 'tree-forest-pine', x: 3218, y: 2723, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-140', assetKey: 'tree-forest-pine', x: 3738, y: 2723, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-143', assetKey: 'tree-forest-broad', x: 1008, y: 2949, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-145', assetKey: 'tree-forest-broad', x: 1528, y: 2949, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-148', assetKey: 'tree-forest-pine', x: 2828, y: 2949, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-150', assetKey: 'tree-forest-pine', x: 3348, y: 2949, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-153', assetKey: 'tree-forest-broad', x: 878, y: 3174, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-155', assetKey: 'tree-forest-broad', x: 1398, y: 3174, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-158', assetKey: 'tree-forest-pine', x: 2698, y: 3174, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-160', assetKey: 'tree-forest-pine', x: 3218, y: 3174, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-163', assetKey: 'tree-forest-broad', x: 1008, y: 3399, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-165', assetKey: 'tree-forest-broad', x: 1528, y: 3399, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-168', assetKey: 'tree-forest-pine', x: 2308, y: 3399, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-170', assetKey: 'tree-forest-pine', x: 2828, y: 3399, targetHeight: 215, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-171', assetKey: 'tree-forest-broad', x: 3088, y: 3399, targetHeight: 371, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-solo-175', assetKey: 'tree-forest-broad', x: 1658, y: 3624, targetHeight: 206, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) },
  { id: 'tree-solo-176', assetKey: 'tree-forest-pine', x: 1918, y: 3624, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-180', assetKey: 'tree-forest-pine', x: 2958, y: 3624, targetHeight: 229, sizeTier: 'base', collision: Object.freeze({"offsetY":-13,"radiusX":29,"radiusY":27}) },
  { id: 'tree-solo-181', assetKey: 'tree-forest-broad', x: 1528, y: 3849, targetHeight: 342, sizeTier: 'plus-80', collision: Object.freeze({"offsetY":-25,"radiusX":56,"radiusY":50}) },
  { id: 'tree-solo-185', assetKey: 'tree-forest-broad', x: 2568, y: 3849, targetHeight: 190, sizeTier: 'base', collision: Object.freeze({"offsetY":-14,"radiusX":31,"radiusY":28}) }
].map((item) => Object.freeze(item)));
