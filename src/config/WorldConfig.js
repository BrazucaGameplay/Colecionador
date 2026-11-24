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
  chunks: Object.freeze({
    enabled: false,
    requiredForInitialWorld: false
  })
});
