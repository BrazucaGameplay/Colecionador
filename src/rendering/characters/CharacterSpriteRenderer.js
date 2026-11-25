import Phaser from 'phaser';
import CharacterActionState from './CharacterActionState.js';
import {
  CHARACTER_ANIMATIONS,
  COMBAT_ANIMATION_SEQUENCE,
  DEFAULT_CHARACTER_SCALE,
  DEFAULT_FAST_MOVEMENT_ANIMATION,
  DEFAULT_IDLE_ANIMATION,
  DEFAULT_MOVEMENT_ANIMATION
} from './CharacterAnimationCatalog.js';

const BASE = import.meta.env.BASE_URL;
const animationEntries = [...new Map(Object.values(CHARACTER_ANIMATIONS).map((item) => [item.key, item])).values()];

export function queuePlayerSpriteAssets(loader) {
  for (const item of animationEntries) {
    loader.json(item.key + '-meta', BASE + item.path + '.json');
    loader.image(item.key, BASE + item.path + '.png');
  }
}

export function registerPlayerSpriteAnimations(scene) {
  for (const item of animationEntries) {
    const metadata = scene.cache.json.get(item.key + '-meta');
    const texture = scene.textures.get(item.key);
    if (!metadata || !texture || !metadata.frames?.length) {
      console.warn('[CharacterAnimations] Pacote indisponível:', item.id);
      continue;
    }
    const byDirection = new Map();
    scene.playerFramePivots ||= new Map();
    for (const record of metadata.frames) {
      const direction = Number(record.direction) || 0;
      const frameName = `d${direction}-f${record.frame}`;
      const pivotY = Number(record.pivotY ?? metadata.pivot?.y);
      if (Number.isFinite(pivotY)) scene.playerFramePivots.set(`${item.key}:${frameName}`, Math.max(0, Math.min(1, pivotY)));
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
  constructor(scene, { x, y, scale = DEFAULT_CHARACTER_SCALE, depthManager = scene.worldDepthManager } = {}) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.moving = false;
    this.movementMode = DEFAULT_MOVEMENT_ANIMATION;
    this.currentAnimation = null;
    this.actionState = new CharacterActionState();
    this.actionToken = null;
    this.nextCombatVariant = 0;
    this.destroyed = false;
    const scaleRatio = scale / 0.62;
    this.shadow = scene.add.ellipse(x, y - 2, 22 * scaleRatio, 9 * scaleRatio, 0x101522, 0.3);
    this.depthManager.apply(this.shadow, y, 'shadow');
    const idle = CHARACTER_ANIMATIONS[DEFAULT_IDLE_ANIMATION];
    const initialPivot = scene.playerFramePivots?.get(`${idle.key}:d0-f0`) ?? 0.9375;
    this.sprite = scene.add.sprite(x, y, idle.key, 'd0-f0')
      .setOrigin(0.5, initialPivot)
      .setScale(scale);
    this.depthManager.apply(this.sprite, y, 'actor');
    this.playLocomotion(true);
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

  setMovementMode(mode) {
    if (mode !== DEFAULT_MOVEMENT_ANIMATION && mode !== DEFAULT_FAST_MOVEMENT_ANIMATION) {
      throw new Error('Modo de movimento desconhecido: ' + mode);
    }
    if (this.movementMode === mode) return;
    this.movementMode = mode;
    if (this.moving && !this.actionState.activeAction) this.playLocomotion();
  }

  playLocomotion(force = false) {
    if (this.destroyed || this.actionState.activeAction) return;
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

  get blocksMovement() {
    return this.actionState.blocksMovement;
  }

  get activeAction() {
    return this.actionState.activeAction;
  }

  canStartAction(actionId) {
    const animation = CHARACTER_ANIMATIONS[actionId];
    if (!animation || ['idle', 'walking', 'running', 'runningVariant'].includes(actionId)) return false;
    return this.actionState.canStart(actionId, animation);
  }

  playAction(actionId, overrides = {}) {
    if (this.destroyed) return false;
    // Alterna os dois golpes disponíveis quando o jogo solicita "combat".
    const resolvedId = actionId === 'combat'
      ? COMBAT_ANIMATION_SEQUENCE[this.nextCombatVariant % COMBAT_ANIMATION_SEQUENCE.length]
      : actionId;
    const animation = CHARACTER_ANIMATIONS[resolvedId];
    if (!animation || ['idle', 'walking', 'running'].includes(resolvedId)) {
      console.warn('[CharacterAnimations] Ação desconhecida ou não acionável:', resolvedId);
      return false;
    }
    const key = this.animationKey(animation);
    if (!key || !this.scene.anims.exists(key)) {
      console.warn('[CharacterAnimations] Pacote da ação indisponível:', resolvedId);
      return false;
    }
    const started = this.actionState.start(resolvedId, { ...animation, ...overrides });
    if (!started.accepted) return false;
    this.sprite.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onActionComplete, this);
    this.actionToken = started.action.token;
    this.currentAnimation = resolvedId;
    this.sprite.play({ key, repeat: animation.loop ? -1 : 0 });
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
