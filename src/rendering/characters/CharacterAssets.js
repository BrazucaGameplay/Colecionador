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
      'assets/characters/skin_01/character.glb?v=20261125-3'
    ),
    modelHeight: 76,
    animated: true,
    weapon: Object.freeze({
      nodeName: 'ColossalSword_AttachedToRightHand',
      handBoneName: 'mixamorig:RightHand',
      gripAxis: 'y',
      gripOffset: 0.75,
      rotation: Object.freeze([0, 0, 0])
    }),
    animations: Object.freeze({
      idle: 'Idle_03',
      walk: 'Running',
      run: 'Run_03',
      attack: 'Combate',
      attackAlternate: 'Combate_dd',
      death: 'Dead',
      jump: null
    })
  })
});

export const DEFAULT_PLAYER_SKIN_ID = 'crimson-flame-sovereign';

export function getPlayerSkin(skinId = DEFAULT_PLAYER_SKIN_ID) {
  return PLAYER_SKINS[skinId] ??
    Object.values(PLAYER_SKINS).find((skin) => skin.id === skinId) ??
    PLAYER_SKINS[DEFAULT_PLAYER_SKIN_ID];
}
