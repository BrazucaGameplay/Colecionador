/** Renderer opcional: falta de textura nunca impede a entidade lógica. */
export function fitMonsterFrameScale(frameWidth, frameHeight, targetWidth, targetHeight) {
  if (![frameWidth, frameHeight, targetWidth, targetHeight].every(value => Number.isFinite(value) && value > 0)) return 1;
  return Math.min(targetWidth / frameWidth, targetHeight / frameHeight);
}

/** Teste AABB no espaço do mundo; a margem evita pop-in durante pan/follow. */
export function isMonsterInView(x, y, width, height, view, padding = 0) {
  if (![x, y, width, height].every(Number.isFinite) || !view ||
      !Number.isFinite(view.x) || !Number.isFinite(view.y)) return true;
  const right = Number.isFinite(view.right) ? view.right : view.x + view.width;
  const bottom = Number.isFinite(view.bottom) ? view.bottom : view.y + view.height;
  if (!Number.isFinite(right) || !Number.isFinite(bottom)) return true;
  const halfWidth = Math.max(0, width) / 2;
  const halfHeight = Math.max(0, height) / 2;
  return x + halfWidth >= view.x - padding &&
    x - halfWidth <= right + padding &&
    y + halfHeight >= view.y - padding &&
    y - halfHeight <= bottom + padding;
}

export default class MonsterRenderer {
  constructor(scene, monster, definition, depthManager) {
    this.scene = scene; this.monster = monster; this.definition = definition;
    this.depthManager = depthManager; this.currentState = null; this.destroyed = false;
    this.actionUntil = 0; this.inView = true;
    const visual = definition.visual;
    const idle = visual?.enabled ? visual.animations?.idle : null;
    this.shadow = null; this.sprite = null; this.frameBox = null;
    if (idle && scene.textures.exists(idle.key)) {
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
    this.sprite.setScale(fitMonsterFrameScale(width, height, this.frameBox.width, this.frameBox.height));
  }
  setInView(visible) {
    if (this.destroyed) return;
    const nextVisibility = Boolean(visible);
    if (this.inView === nextVisibility) return;
    this.inView = nextVisibility;
    const renderVisible = this.inView && this.currentState !== 'death';
    this.sprite?.setVisible(renderVisible);
    this.shadow?.setVisible(renderVisible);
  }
  setShadowEnabled(enabled) {
    if (this.destroyed || !this.sprite || !this.scene) return;
    if (!enabled) {
      this.shadow?.destroy();
      this.shadow = null;
      return;
    }
    if (this.shadow) return;
    this.shadow = this.scene.add.ellipse(
      this.monster.x, this.monster.y - 2, 26, 9, 0x101522, 0.24
    );
    this.depthManager?.apply(this.shadow, this.monster.y, 'shadow');
    this.shadow.setVisible(this.inView && this.currentState !== 'death');
  }
  play(state, now = 0) {
    if (this.destroyed || !this.sprite) return false;
    if ((state === 'idle' || state === 'walking') && this.currentState === 'attack' && now < this.actionUntil) return false;
    const animations = this.definition.visual?.animations || {};
    const requested = animations[state] || animations.idle;
    if (!requested || !this.scene.textures.exists(requested.key)) {
      if (state === 'death') this.setInView(false);
      return false;
    }
    if (this.currentState !== state || this.sprite.texture?.key !== requested.key) {
      this.sprite.setTexture(requested.key);
      this.applyFrameScale();
      this.currentState = state;
    }
    const visible = this.inView && state !== 'death';
    this.sprite.setVisible(visible);
    this.shadow?.setVisible(visible);
    if (state === 'attack') this.actionUntil = now + (Number(this.definition.visual?.attackDurationMs) || 350);
    if (state === 'death') this.actionUntil = Number.POSITIVE_INFINITY;
    return true;
  }
  setTransform(x, y) {
    if (this.destroyed) return;
    this.sprite?.setPosition(x, y); this.shadow?.setPosition(x, y - 2);
    if (this.shadow) this.depthManager?.apply(this.shadow, y, 'shadow');
    if (this.sprite) this.depthManager?.apply(this.sprite, y, 'actor');
  }
  update(now = 0) {
    if (this.currentState === 'attack' && now >= this.actionUntil) this.currentState = null;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; this.sprite?.destroy(); this.shadow?.destroy();
    this.sprite = null; this.shadow = null; this.frameBox = null;
    this.scene = null; this.monster = null; this.definition = null;
  }
}
