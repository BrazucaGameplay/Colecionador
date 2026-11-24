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
  // Mapa temporario apenas para testar projecao/camera; nao e especificacao final.
  prototypePreview: Object.freeze({
    columns: 30,
    rows: 17,
    tileWidth: 64,
    tileHeight: 32,
    originX: 544,
    originY: 16,
    playerSpawnTile: Object.freeze({ x: 8, y: 8 }),
    monsterSpawnTiles: Object.freeze([
      Object.freeze({ x: 12, y: 8 })
    ]),
    status: 'debug-only'
  }),
  chunks: Object.freeze({
    enabled: false,
    requiredForInitialWorld: false
  })
});
