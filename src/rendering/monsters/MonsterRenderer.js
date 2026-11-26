/** Renderer opcional: falta de textura nunca impede a entidade lógica. */
export function fitMonsterFrameScale(frameWidth, frameHeight, targetWidth, targetHeight) {
  if (![frameWidth, frameHeight, targetWidth, targetHeight].every(value => Number.isFinite(value) && value > 0)) return 1;
  return Math.min(targetWidth / frameWidth, targetHeight / frameHeight);
}

export default class MonsterRenderer {
  constructor(scene, monster, definition, depthManager) {
    this.scene = scene; this.monster = monster; this.definition = definition;
    this.depthManager = depthManager; this.currentState = null; this.destroyed = false;
    const visual = definition.visual;
    const idle = visual?.enabled ? visual.animations?.idle : null;
    this.shadow = null; this.sprite = null;
    this.frameBox = null;
    if (idle && scene.textures.exists(idle.key)) {
      this.shadow = scene.add.ellipse(monster.x, monster.y - 2, 26, 9, 0x101522, 0.24);
      this.depthManager?.apply(this.shadow, monster.y, 'shadow');
      this.sprite = scene.add.image(monster.x, monster.y, idle.key)
        .setOrigin(visual.originX ?? 0.5, visual.originY ?? 0.92);
      const frame = this.sprite.frame;
      const baseScale = Number.isFinite(visual.scale) ? visual.scale : 1;
      this.frameBox = {
        width: Math.max(1, frame.realWidth || frame.width) * baseScale,
        height: Math.max(1, frame.realHeight || frame.height) * baseScale
      };
      this.applyFrameScale();
      this.depthManager?.apply(this.sprite, monster.y, 'actor');
      this.play('idle');
    }
  }
  applyFrameScale() {
    if (!this.sprite || !this.frameBox) return;
    const frame = this.sprite.frame;
    const width = frame.realWidth || frame.width;
    const height = frame.realHeight || frame.height;
    const scale = fitMonsterFrameScale(width, height, this.frameBox.width, this.frameBox.height);
    this.sprite.setScale(scale);
  }
  play(state) {
    if (this.destroyed || !this.sprite) return false;
    const animations = this.definition.visual?.animations || {};
    const requested = animations[state] || animations.idle;
    if (!requested || !this.scene.textures.exists(requested.key)) {
      if (state === 'death') this.sprite.setVisible(false);
      return false;
    }
    if (this.currentState !== state || this.sprite.texture?.key !== requested.key) {
      this.sprite.setTexture(requested.key).setVisible(true);
      this.applyFrameScale();
      this.currentState = state;
    }
    return true;
  }
  setTransform(x, y) {
    if (this.destroyed) return;
    this.sprite?.setPosition(x, y); this.shadow?.setPosition(x, y - 2);
    if (this.shadow) this.depthManager?.apply(this.shadow, y, 'shadow');
    if (this.sprite) this.depthManager?.apply(this.sprite, y, 'actor');
  }
  update() {}
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; this.sprite?.destroy(); this.shadow?.destroy();
    this.sprite = null; this.shadow = null; this.frameBox = null;
    this.scene = null; this.monster = null; this.definition = null;
  }
}