const animation = (id, file, clip, loop) => Object.freeze({
  id,
  clip,
  key: 'monster-slime-' + id,
  path: 'assets/monsters/slime/' + file,
  loop,
  frameRate: 10
});

const slimeAnimations = Object.freeze({
  idle: animation('idle', 'slime-idle', 'Idle', true),
  walking: animation('walking', 'slime-walk', 'Walk', true),
  attack: animation('attack', 'slime-attack', 'Attack', false),
  death: animation('death', 'slime-death', 'Death', false)
});

/**
 * Definições de gameplay não dependem de Phaser nem de recursos visuais.
 * Os valores atuais preservam apenas a escala do antigo monstro de teste.
 * Balanceamento, drops e dano de contato ficam deliberadamente neutros até
 * serem definidos no design de combate.
 */
export const MONSTER_DEFINITIONS = Object.freeze({
  slime: Object.freeze({
    id: 'slime',
    name: 'Slime',
    maxHealth: 2,
    speed: 60,
    defense: 0,
    contactDamage: 0,
    experience: 0,
    drops: Object.freeze([]),
    collision: Object.freeze({ radius: 12 }),
    deathDurationMs: 600,
    behavior: Object.freeze({
      moveChance: 0.7,
      decisionMinMs: 800,
      decisionMaxMs: 1600
    }),
    visual: Object.freeze({
      enabled: false,
      scale: 1,
      originX: 0.5,
      originY: 0.9375,
      animations: slimeAnimations
    })
  })
});

export function getMonsterDefinition(id) {
  return MONSTER_DEFINITIONS[id] || null;
}
