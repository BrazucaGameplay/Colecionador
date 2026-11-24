export const PLAYER_CONFIG = Object.freeze({
  movement: Object.freeze({
    // Valor herdado do prototipo; deve ser calibrado com a escala final do mundo.
    speed: 220,
    status: 'provisional'
  }),
  body: Object.freeze({
    width: null,
    height: null,
    status: 'pending-art-and-collision-scale'
  })
});
