/** Catalogo central das skins do protagonista: exatamente quatro animacoes por skin. */
export const REQUIRED_SKIN_ANIMATIONS = Object.freeze(['idle', 'running', 'combat', 'dying']);
export const DEFAULT_CHARACTER_SKIN = 'skin_01';

export const CHARACTER_SKINS = Object.freeze({
  skin_01: Object.freeze({
    id: 'skin_01',
    name: 'Skin Original',
    status: 'ready',
    selectable: true,
    directory: 'assets/characters/sprites/skin_01/',
    portrait: 'assets/characters/sprites/skin_01/perfil.webp',
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
    status: 'preparation',
    selectable: false,
    directory: 'assets/characters/sprites/skin_2/',
    portrait: 'assets/characters/sprites/skin_2/perfil.webp',
    portraitKey: 'skin-portrait-skin_2',
    references: Object.freeze({
      idle: 'assets/characters/sprites/skin_2/parado.jpg',
      running: 'assets/characters/sprites/skin_2/corrida.jpg',
      combat: 'assets/characters/sprites/skin_2/ataque.jpg',
      dying: 'assets/characters/sprites/skin_2/morte.jpg'
    }),
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
