/**
 * Catálogo de skins do protagonista.
 *
 * Os modelos são apenas apresentação: nenhum deles contém estado de jogo,
 * colisão, input ou movimentação.
 *
 * Os GLBs foram mantidos nos caminhos em que já foram enviados ao repositório.
 */
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

export const PLAYER_SKINS = Object.freeze({
  crimsonFlameSovereign: Object.freeze({
    id: 'crimson-flame-sovereign',
    name: 'Crimson Flame Sovereign',
    modelUrl: assetUrl(
      'assets/characters/skin_01/character.glb?v=20261125-2'
    ),
    modelHeight: 76,
    animated: true,
    animations: Object.freeze({
      idle: 'Idle_03',
      walk: 'Running',
      run: 'Run_03',
      attack: 'Combate',
      attackAlternate: 'Combate_dd',
      death: 'Dead',
      jump: null
    })
  }),

  crimsonVeinblade: Object.freeze({
    id: 'crimson-veinblade',
    name: 'Crimson Veinblade',
    modelUrl: assetUrl(
      'assets/characters/crimson-veinblade/character.glb?v=20261125-1'
    ),
    modelHeight: 76,
    animated: false,
    animations: Object.freeze({})
  })
});

export const DEFAULT_PLAYER_SKIN_ID = 'crimson-flame-sovereign';

export function getPlayerSkin(skinId = DEFAULT_PLAYER_SKIN_ID) {
  return PLAYER_SKINS[skinId] ??
    Object.values(PLAYER_SKINS).find((skin) => skin.id === skinId) ??
    PLAYER_SKINS[DEFAULT_PLAYER_SKIN_ID];
}
