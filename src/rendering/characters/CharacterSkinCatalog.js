/**
 * Contrato central das aparências do protagonista.
 *
 * Uma skin só pode ser equipada quando possuir os sete pacotes PNG/JSON.
 * As imagens JPG em skin_2 são referências de arte e não atlas de runtime.
 */
const animation = (id, basename, options = {}) => Object.freeze({
  id,
  basename,
  ...options
});

export const CHARACTER_SKIN_ANIMATIONS = Object.freeze({
  idle: animation('idle', 'idle', { loop: true, required: true }),
  walking: animation('walking', 'running', { loop: true, required: true }),
  running: animation('running', 'running', { loop: true, required: true }),
  dying: animation('dying', 'dead', { loop: false, required: true }),
  flirtyStrut: animation('flirtyStrut', 'flirty_strut', { loop: false, required: true }),
  combat: animation('combat', 'combate_dd', { loop: false, required: true }),
  combatSlash: animation('combatSlash', 'right_hand_sword_slash', { loop: false, required: true }),
  jump: animation('jump', 'salto', { loop: false, required: true })
});

export const CHARACTER_SKINS = Object.freeze({
  skin_01: Object.freeze({
    id: 'skin_01',
    name: 'Skin Original',
    status: 'ready',
    selectable: true,
    directory: 'assets/characters/sprites/skin_01/',
    portrait: 'assets/ui/player-portrait.webp',
    animations: Object.freeze({
      idle: 'skin-basicas-idle',
      walking: 'skin-basicas-running',
      running: 'skin-basicas-running',
      dying: 'skin-basicas-dead',
      flirtyStrut: 'skin-basicas-flirty_strut',
      combat: 'skin-batalha-combate_dd',
      combatSlash: 'skin-batalha-right_hand_sword_slash',
      jump: 'skin-batalha-salto'
    })
  }),
  skin_2: Object.freeze({
    id: 'skin_2',
    name: 'Skin 02',
    status: 'preparation',
    selectable: false,
    directory: 'assets/characters/sprites/skin_2/',
    portrait: 'assets/characters/sprites/skin_2/perfil.webp',
    references: Object.freeze({
      idle: 'assets/characters/sprites/skin_2/parado.jpg',
      running: 'assets/characters/sprites/skin_2/corrida.jpg',
      combat: 'assets/characters/sprites/skin_2/ataque.jpg',
      dying: 'assets/characters/sprites/skin_2/morte.jpg'
    }),
    // Basenames reservados para os futuros atlas PNG/JSON compatíveis.
    animations: Object.freeze({
      idle: 'skin2-idle',
      walking: 'skin2-running',
      running: 'skin2-running',
      dying: 'skin2-dead',
      flirtyStrut: 'skin2-flirty_strut',
      combat: 'skin2-combate_dd',
      combatSlash: 'skin2-right_hand_sword_slash',
      jump: 'skin2-salto'
    })
  })
});

export const DEFAULT_CHARACTER_SKIN = 'skin_01';
export const REQUIRED_SKIN_ANIMATIONS = Object.freeze(Object.keys(CHARACTER_SKIN_ANIMATIONS));

export function getCharacterSkin(skinId) {
  return CHARACTER_SKINS[skinId] ?? CHARACTER_SKINS[DEFAULT_CHARACTER_SKIN];
}
