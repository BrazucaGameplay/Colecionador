import {
  CHARACTER_SKINS,
  DEFAULT_CHARACTER_SKIN,
  REQUIRED_SKIN_ANIMATIONS
} from './CharacterSkinCatalog.js';

/**
 * Mantém a seleção de aparência separada do estado lógico do Player.
 * O manager não altera combate, movimento, câmera ou entidade física.
 */
export default class SkinManager {
  constructor({ selectedSkin = DEFAULT_CHARACTER_SKIN, onChange = () => {} } = {}) {
    this.onChange = onChange;
    this.selectedSkin = this.isSelectable(selectedSkin)
      ? selectedSkin
      : DEFAULT_CHARACTER_SKIN;
  }

  isSelectable(skinId) {
    const skin = CHARACTER_SKINS[skinId];
    if (!skin?.selectable || skin.status !== 'ready') return false;
    return REQUIRED_SKIN_ANIMATIONS.every((animationId) => Boolean(skin.animations?.[animationId]));
  }

  getSelectedSkin() {
    return this.selectedSkin;
  }

  getSelectedDefinition() {
    return CHARACTER_SKINS[this.selectedSkin];
  }

  getCatalog() {
    return Object.values(CHARACTER_SKINS).map((skin) => ({
      id: skin.id,
      name: skin.name,
      status: skin.status,
      selectable: this.isSelectable(skin.id),
      portrait: skin.portrait
    }));
  }

  selectSkin(skinId) {
    if (!this.isSelectable(skinId)) {
      return { changed: false, selectedSkin: this.selectedSkin, reason: 'skin-not-ready' };
    }
    if (skinId === this.selectedSkin) {
      return { changed: false, selectedSkin: this.selectedSkin, reason: 'already-selected' };
    }
    const previousSkin = this.selectedSkin;
    this.selectedSkin = skinId;
    this.onChange({ previousSkin, selectedSkin: skinId });
    return { changed: true, previousSkin, selectedSkin: skinId };
  }

  destroy() {
    this.onChange = () => {};
  }
}
