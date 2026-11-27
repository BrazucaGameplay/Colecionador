import {
  CHARACTER_SKINS,
  DEFAULT_CHARACTER_SKIN,
  REQUIRED_SKIN_ANIMATIONS
} from './CharacterSkinCatalog.js';

export default class SkinManager {
  constructor({
    selectedSkin = DEFAULT_CHARACTER_SKIN,
    onChange = () => {},
    assetValidator = () => false,
    catalog = CHARACTER_SKINS
  } = {}) {
    this.onChange = onChange;
    this.assetValidator = assetValidator;
    this.catalog = catalog;
    this.selectedSkin = this.isSelectable(selectedSkin) ? selectedSkin : DEFAULT_CHARACTER_SKIN;
  }

  isSelectable(id) {
    const skin = this.catalog[id];
    return Boolean(
      skin?.selectable &&
      skin.status === 'ready' &&
      REQUIRED_SKIN_ANIMATIONS.every(key => Boolean(skin.animations?.[key])) &&
      this.assetValidator(id)
    );
  }

  getSelectedSkin() { return this.selectedSkin; }
  getSelectedDefinition() { return this.catalog[this.selectedSkin]; }

  getCatalog() {
    return Object.values(this.catalog).map(skin => ({
      id: skin.id,
      name: skin.name,
      status: skin.status,
      selectable: this.isSelectable(skin.id),
      selected: skin.id === this.selectedSkin,
      portrait: skin.portrait,
      portraitKey: skin.portraitKey
    }));
  }

  selectSkin(id) {
    if (!this.isSelectable(id)) {
      return { changed: false, selectedSkin: this.selectedSkin, reason: 'skin-not-ready' };
    }
    if (id === this.selectedSkin) {
      return { changed: false, selectedSkin: this.selectedSkin, reason: 'already-selected' };
    }
    const previousSkin = this.selectedSkin;
    const result = this.onChange({ previousSkin, selectedSkin: id });
    if (result?.changed === false) {
      return { changed: false, selectedSkin: this.selectedSkin, reason: result.reason || 'renderer-rejected' };
    }
    this.selectedSkin = id;
    return { changed: true, previousSkin, selectedSkin: id };
  }

  destroy() {
    this.onChange = () => {};
    this.assetValidator = () => false;
  }
}
