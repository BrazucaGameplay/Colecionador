import Phaser from 'phaser';

const BASE = import.meta.env.BASE_URL;
const atlas = (id, file, clip, move = false) => ({
  id, clip, move,
  key: `character-atlas-${id}-${clip}`,
  path: `assets/characters/sprites/skin_01/${file}`
});

const SHARED_IDLE_ATLAS = atlas('shared', 'character-anterior-idle_03', 'idle_03');

export const PLAYER_SPRITE_SKINS = Object.freeze({
  'skin-padrao-1': Object.freeze({
    name: 'Skin padrão 1',
    movement: 'running',
    idle: 'idle_03',
    atlases: [
      atlas('skin-padrao-1', 'skin-padrao-1-running', 'running', true),
      atlas('skin-padrao-1', 'skin-padrao-1-walking', 'walking'),
      SHARED_IDLE_ATLAS
    ]
  }),
  'skin-padrao-2': Object.freeze({
    name: 'Skin padrão 2',
    movement: 'running',
    idle: 'idle',
    atlases: [
      atlas('skin-padrao-2', 'skin-padrao-2-running', 'running', true),
      atlas('skin-padrao-2', 'skin-padrao-2-walking', 'walking'),
      atlas('skin-padrao-2', 'skin-padrao-2-idle', 'idle'),
      atlas('skin-padrao-2', 'skin-padrao-2-run_03', 'run_03'),
      atlas('skin-padrao-2', 'skin-padrao-2-dying_backwards', 'dying_backwards'),
      atlas('skin-padrao-2', 'skin-padrao-2-one_arm_handstand', 'one_arm_handstand'),
    ]
  }),
  'skin-padrao-3': Object.freeze({
    name: 'Skin padrão 3',
    movement: 'running',
    idle: 'idle_03',
    atlases: [
      atlas('skin-padrao-3', 'skin-padrao-3-running', 'running', true),
      atlas('skin-padrao-3', 'skin-padrao-3-walking', 'walking'),
      atlas('skin-padrao-3', 'skin-padrao-3-salto', 'salto'),
      SHARED_IDLE_ATLAS,
    ]
  }),
  'skin-padrao-4': Object.freeze({
    name: 'Skin padrão 4',
    movement: 'running',
    idle: 'idle_03',
    atlases: [
      atlas('skin-padrao-4', 'skin-padrao-4-running', 'running', true),
      atlas('skin-padrao-4', 'skin-padrao-4-walking', 'walking'),
      atlas('skin-padrao-4', 'skin-padrao-4-d', 'd'),
      SHARED_IDLE_ATLAS,
    ]
  })
});

const ATTACK_ATLASES = [
  atlas('shared', 'character-anterior-combate', 'combate'),
  atlas('shared', 'character-anterior-combate_dd', 'combate_dd')
];

export const PLAYER_ATTACK_SPRITE_ATLASES = Object.freeze(ATTACK_ATLASES);
export const DEFAULT_PLAYER_SPRITE_SKIN_ID = 'skin-padrao-1';

export function queuePlayerSpriteAssets(loader) {
  const all = new Map([
    ...Object.values(PLAYER_SPRITE_SKINS).flatMap((skin) => skin.atlases),
    ...PLAYER_ATTACK_SPRITE_ATLASES
  ].map((item) => [item.key, item])).values();
  for (const item of all) {
    loader.json(item.key + '-meta', BASE + item.path + '.json');
    loader.image(item.key, BASE + item.path + '.png');
  }
}

export function registerPlayerSpriteAnimations(scene) {
  const all = new Map([
    ...Object.values(PLAYER_SPRITE_SKINS).flatMap((skin) => skin.atlases),
    ...PLAYER_ATTACK_SPRITE_ATLASES
  ].map((item) => [item.key, item])).values();
  for (const item of all) {
    const metadata = scene.cache.json.get(item.key + '-meta');
    const texture = scene.textures.get(item.key);
    if (!metadata || !texture || !metadata.frames?.length) {
      console.warn('[PlayerSprites] Atlas indisponível:', item.key);
      continue;
    }
    const byDirection = new Map();
    for (const record of metadata.frames) {
      const direction = Number(record.direction) || 0;
      const frameName = `d${direction}-f${record.frame}`;
      if (!texture.has(frameName)) {
        texture.add(frameName, 0, record.x, record.y, record.width, record.height);
      }
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
          repeat: -1
        });
      }
    }
  }
}

export default class CharacterSpriteRenderer {
  constructor(scene, { x, y, skinId = DEFAULT_PLAYER_SPRITE_SKIN_ID, scale = 0.62 } = {}) {
    this.scene = scene;
    this.skinId = PLAYER_SPRITE_SKINS[skinId] ? skinId : DEFAULT_PLAYER_SPRITE_SKIN_ID;
    this.skin = PLAYER_SPRITE_SKINS[this.skinId];
    this.x = x;
    this.y = y;
    this.direction = 0;
    this.moving = false;
    this.lockedAction = false;
    this.attackIndex = 0;
    this.destroyed = false;
    this.shadow = scene.add.ellipse(x, y - 2, 22, 9, 0x101522, 0.3).setDepth(y + 19);
    const initialAtlas = this.findAtlas(this.skin.idle) || this.findAtlas(this.skin.movement);
    const initialFrame = initialAtlas ? 'd0-f0' : undefined;
    this.sprite = scene.add.sprite(x, y, initialAtlas?.key || '__MISSING', initialFrame)
      .setOrigin(0.5, 0.92)
      .setScale(scale)
      .setDepth(y + 20);
    this.applyLocomotion();
  }

  findAtlas(clip) {
    return this.skin.atlases.find((item) => item.clip === clip) || null;
  }

  animationKey(item, direction = this.direction) {
    return item ? `${item.key}-d${direction}` : null;
  }

  setDirection(x, y) {
    if (Math.hypot(x, y) < 0.0001) return;
    const sector = Math.PI / 4;
    const angle = Math.atan2(x, y);
    this.direction = ((Math.round(angle / sector) % 8) + 8) % 8;
    if (!this.lockedAction) this.applyLocomotion(true);
  }

  setMoving(moving) {
    const next = Boolean(moving);
    if (this.moving === next) return;
    this.moving = next;
    if (!this.lockedAction) this.applyLocomotion();
  }

  applyLocomotion(force = false) {
    if (this.destroyed || this.lockedAction) return;
    const item = this.moving
      ? this.findAtlas(this.skin.movement)
      : this.findAtlas(this.skin.idle) || this.findAtlas(this.skin.movement);
    const key = this.animationKey(item);
    if (key && this.scene.anims.exists(key)) {
      if (force || this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
    } else if (item) {
      this.sprite.setTexture(item.key, `d${this.direction}-f0`);
    }
  }

  playSlash() {
    if (this.destroyed || this.lockedAction) return false;
    const item = PLAYER_ATTACK_SPRITE_ATLASES[this.attackIndex % PLAYER_ATTACK_SPRITE_ATLASES.length];
    const key = this.animationKey(item);
    if (!key || !this.scene.anims.exists(key)) return false;
    this.attackIndex++;
    this.lockedAction = true;
    this.sprite.play({ key, repeat: 0 });
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this.onAttackComplete, this);
    return true;
  }

  onAttackComplete() {
    this.lockedAction = false;
    this.applyLocomotion(true);
  }

  setTransform(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y).setDepth(y + 20);
    this.shadow.setPosition(x, y - 2).setDepth(y + 19);
  }

  update() {}

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite?.destroy();
    this.shadow?.destroy();
  }
}
