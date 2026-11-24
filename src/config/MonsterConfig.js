export const MONSTER_CONFIG = Object.freeze({
  prototype: Object.freeze({
    maxHealth: 2,
    wander: Object.freeze({
      enabled: true,
      speed: 60,
      intervalMinMs: 800,
      intervalMaxMs: 1600
    }),
    status: 'prototype-only'
  })
});
