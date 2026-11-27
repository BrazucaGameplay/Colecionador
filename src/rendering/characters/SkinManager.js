import { CHARACTER_SKINS, DEFAULT_CHARACTER_SKIN, REQUIRED_SKIN_ANIMATIONS } from './CharacterSkinCatalog.js';
export default class SkinManager {
  constructor({selectedSkin=DEFAULT_CHARACTER_SKIN,onChange=()=>{},assetValidator=()=>false}={}) {
    this.onChange=onChange; this.assetValidator=assetValidator;
    this.selectedSkin=this.isSelectable(selectedSkin)?selectedSkin:DEFAULT_CHARACTER_SKIN;
  }
  isSelectable(id) {
    const skin=CHARACTER_SKINS[id];
    return Boolean(skin?.selectable && skin.status==='ready' &&
      REQUIRED_SKIN_ANIMATIONS.every(key=>Boolean(skin.animations?.[key])) && this.assetValidator(id));
  }
  getSelectedSkin(){return this.selectedSkin;}
  getSelectedDefinition(){return CHARACTER_SKINS[this.selectedSkin];}
  getCatalog(){return Object.values(CHARACTER_SKINS).map(skin=>({
    id:skin.id,name:skin.name,status:skin.status,selectable:this.isSelectable(skin.id),
    selected:skin.id===this.selectedSkin,portrait:skin.portrait
  }));}
  selectSkin(id) {
    if(!this.isSelectable(id))return{changed:false,selectedSkin:this.selectedSkin,reason:'skin-not-ready'};
    if(id===this.selectedSkin)return{changed:false,selectedSkin:this.selectedSkin,reason:'already-selected'};
    const previousSkin=this.selectedSkin, result=this.onChange({previousSkin,selectedSkin:id});
    if(result?.changed===false)return{changed:false,selectedSkin:this.selectedSkin,reason:result.reason||'renderer-rejected'};
    this.selectedSkin=id; return{changed:true,previousSkin,selectedSkin:id};
  }
  destroy(){this.onChange=()=>{};this.assetValidator=()=>false;}
}