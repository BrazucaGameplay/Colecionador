/**
 * Catálogo único de animações do protagonista.
 * Os pacotes são arquivos exportados em separado do mesmo personagem,
 * não representam skins ou personagens diferentes.
 */
const pack = (id, file, clip, usage, { loop = true, returnToLocomotion = true, priority = 30, interruptible = true, lockMovement = false, holdOnComplete = !returnToLocomotion } = {}) => Object.freeze({
  id, file, clip, usage, loop, returnToLocomotion, priority, interruptible, lockMovement, holdOnComplete,
  key: `character-animation-${id}`,
  path: `assets/characters/sprites/skin_01/${file}`
});

export const CHARACTER_ANIMATIONS = Object.freeze({
  idle: pack('idle', 'skin-padrao-2-idle', 'idle', 'repouso'),
  walking: pack('walking', 'skin-padrao-1-walking', 'walking', 'deslocamento a pé'),
  running: pack('running', 'skin-padrao-1-running', 'running', 'deslocamento rápido'),
  combat: pack('combat', 'skin-padrao-1-combate_dd', 'combate_dd', 'ação de combate', { loop: false, priority: 70, interruptible: true, lockMovement: true }),
  jump: pack('jump', 'skin-padrao-3-salto', 'salto', 'salto', { loop: false, priority: 40, interruptible: true }),
  dying: pack('dying', 'skin-padrao-2-dying_backwards', 'dying_backwards', 'morte', { loop: false, returnToLocomotion: false, priority: 100, interruptible: false, lockMovement: true, holdOnComplete: true }),
  handstand: pack('handstand', 'skin-padrao-2-one_arm_handstand', 'one_arm_handstand', 'ação especial', { loop: false, priority: 30, interruptible: true }),
  runningVariant: pack('runningVariant', 'skin-padrao-2-run_03', 'run_03', 'variação de corrida'),
  specialD: pack('specialD', 'skin-padrao-4-d', 'd', 'ação especial', { loop: false, priority: 30, interruptible: true })
});

export const DEFAULT_IDLE_ANIMATION = 'idle';
export const DEFAULT_MOVEMENT_ANIMATION = 'walking';
export const DEFAULT_FAST_MOVEMENT_ANIMATION = 'running';
