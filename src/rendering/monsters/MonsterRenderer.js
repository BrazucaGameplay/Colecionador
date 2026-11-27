/** Renderer de baixo custo para monstros: Image estática e mudanças por estado. */
export function fitMonsterFrameScale(frameWidth, frameHeight, targetWidth, targetHeight) {
  if (![frameWidth, frameHeight, targetWidth, targetHeight].every(value => Number.isFinite(value) && value > 0)) return 1;
  return Math.min(targetWidth / frameWidth, targetHeight / frameHeight);
}

export function isMonsterInView(x, y, width, height, view, padding = 0) {
  if (![x, y, width, height].every(Number.isFinite) || !view ||
      !Number.isFinite(view.x) || !Number.isFinite(view.y)) return true;
  const right = Number.isFinite(view.right) ? view.right : view.x + view.width;
  const bottom = Number.isFinite(view.bottom) ? view.bottom : view.y + view.height;
  if (!Number.isFinite(right) || !Number.isFinite(bottom)) return true;
  const halfWidth = Math.max(0, width) / 2;
  const halfHeight = Math.max(0, height) / 2;
  return x + halfWidth >= view.x - padding && x - halfWidth <= right + padding &&
    y + halfHeight >= view.y - padding && y - halfHeight <= bottom + padding;
}

export default class MonsterRenderer {
  constructor(scene, monster, definition, depthManager) {
    this.scene = scene;
    this.depthManager = depthManager;
    this.sprite = null;
    this.shadow = null;
    this.frameBox = null;
    this.destroyed = false;
    this.reset(monster, definition);
  }

  reset(monster, definition) {
    this.monster = monster;
    this.definition = definition;
    this.currentState = null;
    this.actionUntil = 0;
    this.inView = true;
    this.shadowEnabled = false;
    this.lastX = monster.x;
    this.lastY = monster.y;
    const visual = definition.visual;
    const idle = visual?.enabled ? visual.animations?.idle : null;

    if (idle && this.scene.textures.exists(idle.key)) {
      if (!this.sprite) this.sprite = this.scene.add.image(monster.x, monster.y, idle.key);
      else this.sprite.setTexture(idle.key).setPosition(monster.x, monster.y).setVisible(true);
      this.sprite.setOrigin(visual.originX ?? 0.5, visual.originY ?? 0.92);
      const frame = this.sprite.frame;
      const baseScale = Number.isFinite(visual.scale) ? visual.scale : 1;
      this.frameBox = {
        width: Math.max(1, frame.realWidth || frame.width) * baseScale,
        height: Math.max(1, frame.realHeight || frame.height) * baseScale
      };
      this.applyFrameScale();
      this.depthManager?.apply(this.sprite, monster.y, 'actor');
      this.play('idle');
    } else if (this.sprite) this.sprite.setVisible(false);

    if (this.shadow) {
      this.shadow.setPosition(monster.x, monster.y - 2).setVisible(false);
      this.depthManager?.apply(this.shadow, monster.y, 'shadow');
    }
    return this;
  }

  applyFrameScale() {
    if (!this.sprite || !this.frameBox) return;
    const frame = this.sprite.frame;
    this.sprite.setScale(fitMonsterFrameScale(
      frame.realWidth || frame.width, frame.realHeight || frame.height,
      this.frameBox.width, this.frameBox.height
    ));
  }

  setInView(visible) {
    if (this.destroyed) return;
    const next = Boolean(visible);
    if (this.inView === next) return;
    this.inView = next;
    const renderVisible = next && this.currentState !== 'death';
    this.sprite?.setVisible(renderVisible);
    this.shadow?.setVisible(renderVisible && this.shadowEnabled);
  }

  setShadowEnabled(enabled) {
    if (this.destroyed || !this.sprite || !this.scene) return;
    this.shadowEnabled = Boolean(enabled);
    if (!this.shadowEnabled) {
      this.shadow?.setVisible(false);
      return;
    }
    if (!this.shadow) {
      const shadowScale = Math.max(0, Number(this.definition.visual?.shadowScale) || 1);
      this.shadow = this.scene.add.ellipse(
        this.monster.x, this.monster.y - 2,
        26 * shadowScale, 9 * shadowScale, 0x101522, 0.24
      );
      this.depthManager?.apply(this.shadow, this.monster.y, 'shadow');
    }
    this.shadow.setVisible(this.inView && this.currentState !== 'death');
  }

  play(state, now = 0) {
    if (this.destroyed || !this.sprite) return false;
    if ((state === 'idle' || state === 'walking') &&
        this.currentState === 'attack' && now < this.actionUntil) return false;
    const animations = this.definition.visual?.animations || {};
    const requested = animations[state] || animations.idle;
    if (!requested || !this.scene.textures.exists(requested.key)) {
      if (state === 'death') this.setInView(false);
      return false;
    }
    const changed = this.currentState !== state || this.sprite.texture?.key !== requested.key;
    if (!changed) return true;
    this.sprite.setTexture(requested.key);
    this.applyFrameScale();
    this.currentState = state;
    const visible = this.inView && state !== 'death';
    this.sprite.setVisible(visible);
    this.shadow?.setVisible(visible && this.shadowEnabled);
    if (state === 'attack') this.actionUntil = now + (Number(this.definition.visual?.attackDurationMs) || 350);
    if (state === 'death') this.actionUntil = Number.POSITIVE_INFINITY;
    return true;
  }

  setTransform(x, y) {
    if (this.destroyed || (x === this.lastX && y === this.lastY)) return;
    this.lastX = x;
    this.lastY = y;
    this.sprite?.setPosition(x, y);
    this.shadow?.setPosition(x, y - 2);
    if (this.shadow) this.depthManager?.apply(this.shadow, y, 'shadow');
    if (this.sprite) this.depthManager?.apply(this.sprite, y, 'actor');
  }

  update(now = 0) {
    if (this.currentState === 'attack' && now >= this.actionUntil) {
      this.currentState = null;
      return true;
    }
    return false;
  }

  release() {
    if (this.destroyed) return;
    this.currentState = null;
    this.actionUntil = 0;
    this.inView = false;
    this.shadowEnabled = false;
    this.sprite?.setVisible(false);
    this.shadow?.setVisible(false);
    this.monster = null;
    this.definition = null;
    this.frameBox = null;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.sprite = null;
    this.shadow = null;
    this.frameBox = null;
    this.scene = null;
    this.monster = null;
    this.definition = null;
    this.depthManager = null;
  }
}
