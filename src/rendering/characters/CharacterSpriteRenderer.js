import Phaser from 'phaser';
import {
  CHARACTER_ANIMATIONS,
  DEFAULT_FAST_MOVEMENT_ANIMATION,
  DEFAULT_IDLE_ANIMATION,
  DEFAULT_MOVEMENT_ANIMATION
} from './CharacterAnimationCatalog.js';

const BASE = import.meta.env.BASE_URL;
const animationEntries = Object.entries(CHARACTER_ANIMATIONS);

export function queuePlayerSpriteAssets(loader) {
  for (const [, item] of animationEntries) {
    loader.json(item.key + '-meta', BASE + item.path + '.json');
    loader.image(item.key, BASE + item.path + '.png');
  }
}

export function registerPlayerSpriteAnimations(scene) {
  for (const [, item] of animationEntries) {
    const metadata = scene.cache.json.get(item.key + '-meta');
    const texture = scene.textures.get(item.key);
    if (!metadata || !texture || !metadata.frames?.length) {
      console.warn('[CharacterAnimations] Pacote indisponível:', item.id);
      continue;
    }
    const byDirection = new Map();
    for (const record of metadata.frames) {
      const direction = Number(record.direction) || 0;
      const frameName = `d${direction}-f${record.frame}`;
      if (!texture.has(frameName)) texture.add(frameName, 0, record.x, record.y, record.width, record.height);
      if (!byDirection.has(direction)) byDirection.set(direction, []);
      byDirection.get(direction).push({ frame: frameName, index: record.frame });
    }
    for (const [direction, frames] of byDirection) {
      frames.sort((a, b) => a.index - b.index);
      const key = `${item.key}-d${direction}`;
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: frames.map(({ frame }) => ({ key: item.key, frame })),
          frameRate: metadata.fps || 12,
          repeat: item.loop ? -1 : 0
        });
      }
    }
  }
}

export default class CharacterSpriteRenderer {
  constructor(scene, { x, y, scale = 0.62, depthManager = scene.worldDepthManager } = {}) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.moving = false;
    this.movementMode = DEFAULT_MOVEMENT_ANIMATION;
    this.currentAnimation = null;
    this.currentAction = null;
    this.actionLocked = false;
    this.destroyed = false;
    this.shadow = scene.add.ellipse(x, y - 2, 22, 9, 0x101522, 0.3);
    this.depthManager.apply(this.shadow, y, 'shadow');
    const idle = CHARACTER_ANIMATIONS[DEFAULT_IDLE_ANIMATION];
    this.sprite = scene.add.sprite(x, y, idle.key, 'd0-f0')
      .setOrigin(0.5, 0.92)
      .setScale(scale);
    this.depthManager.apply(this.sprite, y, 'actor');
    this.playLocomotion(true);
  }

  animationKey(animation, direction = this.direction) {
    return animation ? `${animation.key}-d${direction}` : null;
  }

  setDirection(x, y) {
    if (Math.hypot(x, y) < 0.0001 || this.actionLocked) return;
    const sector = Math.PI / 4;
    const angle = Math.atan2(x, y);
    const nextDirection = ((Math.round(angle / sector) % 8) + 8) % 8;
    if (nextDirection === this.direction) return;
    this.direction = nextDirection;
    if (this.currentAction) this.playAction(this.currentAction);
    else this.playLocomotion(true);
  }

  setMoving(moving) {
    const next = Boolean(moving);
    if (this.moving === next) return;
    this.moving = next;
    if (!this.currentAction && !this.actionLocked) this.playLocomotion();
  }

  setMovementMode(mode) {
    if (mode !== DEFAULT_MOVEMENT_ANIMATION && mode !== DEFAULT_FAST_MOVEMENT_ANIMATION) {
      throw new Error('Modo de movimento desconhecido: ' + mode);
    }
    if (this.movementMode === mode) return;
    this.movementMode = mode;
    if (this.moving && !this.currentAction && !this.actionLocked) this.playLocomotion();
  }

  playLocomotion(force = false) {
    if (this.destroyed || this.currentAction || this.actionLocked) return;
    const id = this.moving ? this.movementMode : DEFAULT_IDLE_ANIMATION;
    const animation = CHARACTER_ANIMATIONS[id];
    const key = this.animationKey(animation);
    if (!key || !this.scene.anims.exists(key)) {
      console.warn('[CharacterAnimations] Animação não registrada:', id);
      return;
    }
    if (!force && this.currentAnimation === id) return;
    this.currentAnimation = id;
    this.sprite.play(key, true);
  }

  playAction(actionId) {
    if (this.destroyed) return false;
    const animation = CHARACTER_ANIMATIONS[actionId];
    if (!animation || ['idle', 'walking', 'running', 'runningVariant'].includes(actionId)) {
      console.warn('[CharacterAnimations] Ação desconhecida ou não acionável:', actionId);
      return false;
    }
    const key = this.animationKey(animation);
    if (!key || !this.scene.anims.exists(key)) {
      console.warn('[CharacterAnimations] Pacote da ação indisponível:', actionId);
      return false;
    }
    this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.currentAction = actionId;
    this.currentAnimation = actionId;
    this.sprite.play({ key, repeat: animation.loop ? -1 : 0 });
    if (!animation.loop) this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    return true;
  }

  onActionComplete() {
    const actionId = this.currentAction;
    const animation = CHARACTER_ANIMATIONS[actionId];
    this.currentAction = null;
    if (animation?.returnToLocomotion) this.playLocomotion(true);
    else {
      this.actionLocked = true;
      this.currentAnimation = actionId;
    }
  }

  setTransform(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y - 2);
    this.depthManager.apply(this.shadow, y, 'shadow');
    this.depthManager.apply(this.sprite, y, 'actor');
  }

  update() {}

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite?.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.sprite?.destroy();
    this.shadow?.destroy();
  }
}
