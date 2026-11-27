/** Catálogo central das skins do protagonista: exatamente quatro animações por skin. */
export const REQUIRED_SKIN_ANIMATIONS = Object.freeze(['idle', 'running', 'combat', 'dying']);
export const DEFAULT_CHARACTER_SKIN = 'skin_01';

export const CHARACTER_SKINS = Object.freeze({
  skin_01: Object.freeze({
    id: 'skin_01',
    name: 'Skin Original',
    status: 'ready',
    selectable: true,
    directory: 'assets/characters/sprites/skin_01/',
    portrait: 'assets/characters/sprites/skin_01/perfil.png',
    portraitKey: 'player-portrait',
    animations: Object.freeze({
      idle: 'skin-basicas-idle',
      running: 'skin-basicas-running',
      combat: 'skin-batalha-combate_dd',
      dying: 'skin-basicas-dead'
    })
  }),
  skin_2: Object.freeze({
    id: 'skin_2',
    name: 'Skin 02',
    status: 'ready',
    selectable: true,
    directory: 'assets/characters/sprites/skin_2/',
    portrait: 'assets/characters/sprites/skin_2/perfil.png',
    portraitKey: 'skin-portrait-skin_2',
    animations: Object.freeze({
      idle: 'skin2-idle',
      running: 'skin2-running',
      combat: 'skin2-combat',
      dying: 'skin2-dying'
    })
  })
});

export function getCharacterSkin(skinId) {
  return CHARACTER_SKINS[skinId] ?? CHARACTER_SKINS[DEFAULT_CHARACTER_SKIN];
}
