/** Renderer dos monstros usando uma imagem WebP por estado. */
export default class MonsterRenderer {
  constructor(scene, monster, definition, depthManager) {
    this.scene = scene;
    this.monster = monster;
    this.definition = definition;
    this.depthManager = depthManager;
    this.currentState = null;
    this.destroyed = false;
    const visual = definition.visual;
    const idle = visual.animations.idle;
    this.shadow = scene.add.ellipse(monster.x, monster.y - 2, 26, 9, 0x101522, 0.24);
    this.depthManager?.apply(this.shadow, monster.y, 'shadow');
    this.sprite = scene.add.image(monster.x, monster.y, idle.key)
      .setOrigin(visual.originX ?? 0.5, visual.originY ?? 0.92)
      .setScale(visual.scale || 1);
    this.depthManager?.apply(this.sprite, monster.y, 'actor');
    this.play('idle');
  }
  play(state) {
    if (this.destroyed || !this.sprite) return;
    const animations = this.definition.visual.animations;
    const requested = animations[state] || animations.idle;
    if (this.currentState === state && this.sprite.texture?.key === requested.key) return;
    if (this.scene.textures.exists(requested.key)) this.sprite.setTexture(requested.key).setVisible(true);
    else if (state === 'death') this.sprite.setVisible(false);
    else if (this.scene.textures.exists(animations.idle.key)) this.sprite.setTexture(animations.idle.key).setVisible(true);
    this.currentState = state;
  }
  setTransform(x, y) {
    if (this.destroyed) return;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y - 2);
    this.depthManager?.apply(this.shadow, y, 'shadow');
    this.depthManager?.apply(this.sprite, y, 'actor');
  }
  update() {}
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.sprite = null;
    this.shadow = null;
    this.scene = null;
    this.monster = null;
    this.definition = null;
  }
}
