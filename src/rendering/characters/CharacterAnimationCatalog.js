/**
 * Catálogo de animações do protagonista.
 * Os pacotes de animação foram consolidados em atlas PNG/JSON da Skin 01.
 * O runtime não depende de modelos 3D nem de fontes GLB.
 */
const pack = (id, file, clip, usage, {
  loop = true, returnToLocomotion = true, priority = 30,
  interruptible = true, lockMovement = false, holdOnComplete = !returnToLocomotion
} = {}) => Object.freeze({
  id, file, clip, usage, loop, returnToLocomotion, priority, interruptible, lockMovement, holdOnComplete,
  key: `character-animation-${id}`,
  path: `assets/characters/sprites/skin_01/${file}`
});

const running = pack('running', 'skin-basicas-running', 'Running', 'deslocamento');

export const CHARACTER_ANIMATIONS = Object.freeze({
  idle: pack('idle', 'skin-basicas-idle', 'Idle', 'repouso'),
  walking: running,
  running,
  dying: pack('dying', 'skin-basicas-dead', 'Dead', 'morte', {
    loop: false, returnToLocomotion: false, priority: 100,
    interruptible: false, lockMovement: true, holdOnComplete: true
  }),
  flirtyStrut: pack('flirtyStrut', 'skin-basicas-flirty_strut', 'Flirty_Strut', 'passo especial', {
    loop: false, priority: 30, interruptible: true
  }),
  combat: pack('combat', 'skin-batalha-combate_dd', 'Combate_dd', 'ataque de combate', {
    loop: false, priority: 70, interruptible: true, lockMovement: true
  }),
  combatSlash: pack('combatSlash', 'skin-batalha-right_hand_sword_slash', 'Right_Hand_Sword_Slash', 'corte de espada', {
    loop: false, priority: 70, interruptible: true, lockMovement: true
  }),
  jump: pack('jump', 'skin-batalha-salto', 'Salto', 'salto', {
    loop: false, priority: 40, interruptible: true
  })
});

// Ordem cíclica dos três movimentos usados pelo ataque automático.
export const COMBAT_ANIMATION_SEQUENCE = Object.freeze([
  'combat',
  'jump',
  'combatSlash'
]);

// Escala mundial do sprite: aumento de aproximadamente 18% sobre 0.95.
export const DEFAULT_CHARACTER_SCALE = 1.35;

export const DEFAULT_IDLE_ANIMATION = 'idle';
export const DEFAULT_MOVEMENT_ANIMATION = 'walking';
export const DEFAULT_FAST_MOVEMENT_ANIMATION = 'running';
