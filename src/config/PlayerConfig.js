export const PLAYER_CONFIG = Object.freeze({
  movement: Object.freeze({
    speed: 220,
    status: 'provisional'
  }),
  health: Object.freeze({
    initial: 3,
    status: 'prototype-only'
  }),
  body: Object.freeze({
    width: null,
    height: null,
    status: 'pending-art-and-collision-scale'
  })
});
