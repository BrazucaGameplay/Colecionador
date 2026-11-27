import * as Phaser from 'phaser';
import CharacterActionState from './CharacterActionState.js';
import {
  CHARACTER_ANIMATIONS,
  getCharacterAnimationsForSkin,
  DEFAULT_CHARACTER_SCALE,
  DEFAULT_IDLE_ANIMATION,
  DEFAULT_MOVEMENT_ANIMATION
} from './CharacterAnimationCatalog.js';
import { CHARACTER_SKINS, DEFAULT_CHARACTER_SKIN } from './CharacterSkinCatalog.js';

const BASE = import.meta.env.BASE_URL;
const uniqueEntries = animations => [...new Map(Object.values(animations).map(item => [item.key,item])).values()];

export function queuePlayerSpriteAssets(loader) {
  for (const skin of Object.values(CHARACTER_SKINS)) {
    if (!skin.selectable || skin.status !== 'ready') continue;
    for (const item of uniqueEntries(getCharacterAnimationsForSkin(skin) || {})) {
      loader.json(item.key + '-meta', BASE + item.path + '.json');
      loader.image(item.key, BASE + item.path + '.png');
    }
  }
}

export function registerPlayerSpriteAnimations(scene) {
  scene.characterAnimationsBySkin ||= new Map();
  scene.playerFramePivots ||= new Map();
  for (const skin of Object.values(CHARACTER_SKINS)) {
    if (!skin.selectable || skin.status !== 'ready') continue;
    const animations = getCharacterAnimationsForSkin(skin);
    if (!animations) continue;
    let complete = true;
    for (const item of uniqueEntries(animations)) {
      const metadata = scene.cache.json.get(item.key + '-meta');
      const texture = scene.textures.get(item.key);
      if (!metadata || !texture || !Array.isArray(metadata.frames) || !metadata.frames.length) {
        console.warn('[CharacterAnimations] Pacote indisponível:', skin.id, item.id); complete = false; continue;
      }
      const dirs = new Map();
      for (const record of metadata.frames) {
        const direction = Number(record.direction);
        if (!Number.isInteger(direction) || direction < 0 || direction > 7) continue;
        const frameName = `d${direction}-f${record.frame}`;
        const pivotY = Number(record.pivotY ?? metadata.pivot?.y);
        if (Number.isFinite(pivotY)) scene.playerFramePivots.set(`${item.key}:${frameName}`,Math.max(0,Math.min(1,pivotY)));
        if (!texture.has(frameName)) texture.add(frameName,0,record.x,record.y,record.width,record.height);
        if (!dirs.has(direction)) dirs.set(direction,[]);
        dirs.get(direction).push({frame:frameName,index:Number(record.frame)||0});
      }
      for (let direction=0;direction<8;direction++) {
        const frames=dirs.get(direction)||[];
        if (!frames.length) { complete=false; continue; }
        frames.sort((a,b)=>a.index-b.index);
        const key=`${item.key}-d${direction}`;
        if (!scene.anims.exists(key)) scene.anims.create({key,frames:frames.map(({frame})=>({key:item.key,frame})),frameRate:metadata.fps||12,repeat:item.loop?-1:0});
      }
    }
    if (complete) scene.characterAnimationsBySkin.set(skin.id,animations);
  }
}

export default class CharacterSpriteRenderer {
  constructor(scene, { x, y, scale = DEFAULT_CHARACTER_SCALE, depthManager = scene.worldDepthManager, skinId = DEFAULT_CHARACTER_SKIN } = {}) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.moving = false;
    this.currentAnimation = null;
    this.actionState = new CharacterActionState();
    this.actionToken = null;
    this.baseScale = scale;
    this.actionScaleMultiplier = 1.35;
    this.destroyed = false;
    this.skinId = DEFAULT_CHARACTER_SKIN;
    this.animations = scene.characterAnimationsBySkin?.get(DEFAULT_CHARACTER_SKIN) || CHARACTER_ANIMATIONS;
    const scaleRatio = scale / 0.62;
    this.shadow = scene.add.ellipse(x, y - 2, 22 * scaleRatio, 9 * scaleRatio, 0x101522, 0.3);
    this.depthManager.apply(this.shadow, y, 'shadow');
    const idle = this.animations[DEFAULT_IDLE_ANIMATION];
    const initialPivot = scene.playerFramePivots?.get(`${idle.key}:d0-f0`) ?? 0.9375;
    this.sprite = scene.add.sprite(x, y, idle.key, 'd0-f0')
      .setOrigin(0.5, initialPivot)
      .setScale(scale);
    this.depthManager.apply(this.sprite, y, 'actor');
    this.playLocomotion(true);
    if (skinId !== DEFAULT_CHARACTER_SKIN) this.setSkin(skinId);
  }

  isSkinLoaded(id) { return Boolean(this.scene.characterAnimationsBySkin?.has(id)); }

  setSkin(id) {
    if (this.destroyed || !this.isSkinLoaded(id)) return {changed:false,reason:'skin-assets-unavailable'};
    if (id === this.skinId) return {changed:false,reason:'already-selected'};
    if (this.actionState.activeAction) return {changed:false,reason:'action-active'};
    const animations=this.scene.characterAnimationsBySkin.get(id), idle=animations[DEFAULT_IDLE_ANIMATION];
    if (!idle || !this.scene.anims.exists(`${idle.key}-d${this.direction}`)) return {changed:false,reason:'skin-animation-unavailable'};
    this.skinId=id; this.animations=animations; this.sprite.stop();
    this.sprite.setTexture(idle.key,`d${this.direction}-f0`);
    const pivot=this.scene.playerFramePivots?.get(`${idle.key}:d${this.direction}-f0`) ?? 0.9375;
    this.sprite.setOrigin(0.5,pivot).setScale(this.baseScale);
    this.currentAnimation=null; this.playLocomotion(true); this.depthManager.apply(this.sprite,this.y,'actor');
    return {changed:true,skinId:id};
  }

  animationKey(animation, direction = this.direction) {
    return animation ? `${animation.key}-d${direction}` : null;
  }

  setDirection(x, y) {
    if (Math.hypot(x, y) < 0.0001 || this.actionState.activeAction) return;
    const sector = Math.PI / 4;
    const angle = Math.atan2(x, y);
    const nextDirection = ((Math.round(angle / sector) % 8) + 8) % 8;
    if (nextDirection === this.direction) return;
    this.direction = nextDirection;
    if (!this.actionState.activeAction) this.playLocomotion(true);
  }

  setMoving(moving) {
    const next = Boolean(moving);
    if (this.moving === next) return;
    this.moving = next;
    if (!this.actionState.activeAction) this.playLocomotion();
  }

  playLocomotion(force = false) {
    if (this.destroyed || this.actionState.activeAction) return;
    const id = this.moving ? DEFAULT_MOVEMENT_ANIMATION : DEFAULT_IDLE_ANIMATION;
    const animation = this.animations[id];
    const key = this.animationKey(animation);
    if (!key || !this.scene.anims.exists(key)) {
      console.warn('[CharacterAnimations] Animação não registrada:', id);
      return;
    }
    if (!force && this.currentAnimation === id) return;
    this.currentAnimation = id;
    this.sprite.setScale(this.baseScale);
    this.sprite.play(key, true);
  }

  get blocksMovement() {
    return this.actionState.blocksMovement;
  }

  get activeAction() {
    return this.actionState.activeAction;
  }

  canStartAction(actionId) {
    const animation = this.animations[actionId];
    if (!animation || ['idle', 'running'].includes(actionId)) return false;
    return this.actionState.canStart(actionId, animation);
  }

  playAction(actionId, overrides = {}) {
    if (this.destroyed) return false;
    const animation = this.animations[actionId];
    if (!animation || ['idle', 'running'].includes(actionId)) {
      console.warn('[CharacterAnimations] Ação desconhecida ou não acionável:', actionId);
      return false;
    }
    const key = this.animationKey(animation);
    if (!key || !this.scene.anims.exists(key)) {
      console.warn('[CharacterAnimations] Pacote da ação indisponível:', actionId);
      return false;
    }
    const { durationMs, ...actionOverrides } = overrides;
    const started = this.actionState.start(actionId, {
      ...animation,
      ...actionOverrides,
      ...(actionId === 'combat' ? {
        priority: this.animations.combat.priority,
        interruptible: true,
        lockMovement: true,
        restartExisting: true
      } : {})
    });
    if (!started.accepted) return false;
    this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.actionToken = started.action.token;
    this.currentAnimation = actionId;
    this.sprite.setScale(this.baseScale * this.actionScaleMultiplier);
    const playConfig = {
      key,
      frameRate: Number.isFinite(durationMs) && durationMs > 0 ? null : undefined,
      repeat: animation.loop ? -1 : 0,
      ...(Number.isFinite(durationMs) && durationMs > 0 ? { duration: durationMs } : {})
    };
    this.sprite.play(playConfig);
    if (!animation.loop) this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    return true;
  }

  onActionComplete() {
    const result = this.actionState.complete(this.actionToken);
    if (!result.matched) return;
    if (result.held) {
      this.currentAnimation = this.actionState.activeAction;
      return;
    }
    this.actionToken = null;
    this.currentAnimation = null;
    this.playLocomotion(true);
  }

  cancelAction({ force = false } = {}) {
    if (!this.actionState.cancel({ force })) return false;
    this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.actionToken = null;
    this.currentAnimation = null;
    this.playLocomotion(true);
    return true;
  }

  setTransform(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y - 2);
    this.depthManager.apply(this.shadow, y, 'shadow');
    this.depthManager.apply(this.sprite, y, 'actor');
  }

  update() {
    if (this.destroyed || !this.sprite) return;
    const textureKey = this.sprite.texture?.key;
    const frameName = this.sprite.frame?.name;
    const pivotY = this.scene.playerFramePivots?.get(`${textureKey}:${frameName}`);
    if (Number.isFinite(pivotY) && Math.abs(this.sprite.originY - pivotY) > 0.0001) {
      // Alinha o último pixel visível da pose à coordenada real do chão.
      this.sprite.setOrigin(0.5, pivotY);
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite?.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.sprite?.destroy();
    this.shadow?.destroy();
  }
}
