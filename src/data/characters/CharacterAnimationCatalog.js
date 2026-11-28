/** Comportamento compartilhado das quatro animacoes do protagonista. */
const pack = (id, file, clip, usage, {
  loop = true, returnToLocomotion = true, priority = 0,
  interruptible = true, lockMovement = false, holdOnComplete = !returnToLocomotion
} = {}) => Object.freeze({
  id, file, clip, usage, loop, returnToLocomotion, priority,
  interruptible, lockMovement, holdOnComplete,
  key: 'character-animation-' + id,
  path: 'assets/characters/sprites/skin_01/' + file
});

export const CHARACTER_ANIMATIONS = Object.freeze({
  idle: pack('idle', 'skin-basicas-idle', 'Idle', 'parado'),
  running: pack('running', 'skin-basicas-running', 'Running', 'correndo'),
  combat: pack('combat', 'skin-batalha-combate_dd', 'Combate_dd', 'combate', {
    loop: false, returnToLocomotion: true, priority: 70,
    interruptible: true, lockMovement: true
  }),
  dying: pack('dying', 'skin-basicas-dead', 'Dead', 'morte', {
    loop: false, returnToLocomotion: false, priority: 100,
    interruptible: false, lockMovement: true, holdOnComplete: true
  })
});

export function getCharacterAnimationsForSkin(skin) {
  if (!skin?.id || !skin?.directory || !skin?.animations) return null;
  const result = {};
  for (const [id, base] of Object.entries(CHARACTER_ANIMATIONS)) {
    const basename = skin.animations[id];
    if (!basename) return null;
    result[id] = Object.freeze({
      ...base,
      key: skin.id === 'skin_01' ? base.key : 'character-animation-' + skin.id + '-' + id,
      path: skin.directory + basename
    });
  }
  return Object.freeze(result);
}

export const DEFAULT_CHARACTER_SCALE = 1.35;
export const DEFAULT_IDLE_ANIMATION = 'idle';
export const DEFAULT_MOVEMENT_ANIMATION = 'running';
