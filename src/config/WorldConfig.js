export const WORLD_CONFIG = Object.freeze({
  projection: 'isometric',
  dimensions: Object.freeze({
    widthTiles: null,
    heightTiles: null,
    status: 'pending-design'
  }),
  tileMetrics: Object.freeze({
    tileWidth: null,
    tileHeight: null,
    status: 'pending-art-scale'
  }),
  // Cena de depuracao ortogonal, sem valor de especificacao para o mundo final.
  prototypePreview: Object.freeze({
    columns: 30,
    rows: 17,
    cellSize: 32,
    playerSpawn: Object.freeze({ x: 480, y: 270 }),
    monsterSpawns: Object.freeze([
      Object.freeze({ x: 200, y: 150 })
    ]),
    status: 'debug-only'
  }),
  chunks: Object.freeze({
    enabled: false,
    requiredForInitialWorld: false
  })
});
