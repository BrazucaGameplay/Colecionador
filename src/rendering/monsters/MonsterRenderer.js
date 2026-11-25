/**
 * Apresentação opcional do monstro. Sem atlas válido, a entidade não é criada
 * pelo MonsterManager; nenhum círculo ou sprite provisório é desenhado.
 */
export default class MonsterRenderer {
  constructor(scene, monster, definition, depthManager) {
    this.scene = scene;
    this.monster = monster;
    this.definition = definition;
    this.depthManager = depthManager;
    this.currentState = null;
    this.currentDirection = -1;
    this.destroyed = false;

    const visual = definition.visual;
    const idle = visual.animations.idle;
    const frame = 'd0-f0';
    const pivot = scene.monsterFramePivots?.get(idle.key + ':' + frame);
    const originX = pivot?.x ?? visual.originX ?? 0.5;
    const originY = pivot?.y ?? visual.originY ?? 0.9375;

    this.shadow = scene.add.ellipse(monster.x, monster.y - 2, 26, 9, 0x101522, 0.24);
    this.depthManager?.apply(this.shadow, monster.y, 'shadow');

    this.sprite = scene.add.sprite(monster.x, monster.y, idle.key, frame)
      .setOrigin(originX, originY)
      .setScale(visual.scale || 1);
    this.depthManager?.apply(this.sprite, monster.y, 'actor');
    this.play('idle', 0);
  }

  play(state, direction = 0) {
    if (this.destroyed || !this.sprite) return;
    const visual = this.definition.visual;
    const requested = visual.animations[state] || visual.animations.idle;
    const fallback = visual.animations.idle;
    const animationKey = requested.key + '-d' + direction;

    if (this.currentState === state && this.currentDirection === direction) return;

    const requestedTexture = this.scene.textures.get(requested.key);
    const requestedFrame = 'd' + direction + '-f0';
    const idleTexture = this.scene.textures.get(fallback.key);
    const idleFrame = 'd' + direction + '-f0';

    if (this.scene.anims.exists(animationKey)) {
      this.sprite.setVisible(true);
      this.sprite.play(animationKey, true);
    } else if (requestedTexture?.has(requestedFrame)) {
      this.sprite.setVisible(true);
      this.sprite.setTexture(requested.key, requestedFrame);
    } else if (state === 'death') {
      // Sem atlas de morte não se exibe uma pose viva durante o tempo de remoção.
      this.sprite.setVisible(false);
    } else if (this.scene.anims.exists(fallback.key + '-d' + direction)) {
      this.sprite.setVisible(true);
      this.sprite.play(fallback.key + '-d' + direction, true);
    } else if (idleTexture?.has(idleFrame)) {
      this.sprite.setVisible(true);
      this.sprite.setTexture(fallback.key, idleFrame);
    }

    this.currentState = state;
    this.currentDirection = direction;
  }

  setTransform(x, y) {
    if (this.destroyed) return;
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y - 2);
    this.depthManager?.apply(this.shadow, y, 'shadow');
    this.depthManager?.apply(this.sprite, y, 'actor');
  }

  update() {
    if (this.destroyed || !this.sprite) return;
    const textureKey = this.sprite.texture?.key;
    const frameName = this.sprite.frame?.name;
    const pivot = this.scene.monsterFramePivots?.get(textureKey + ':' + frameName);
    if (pivot && (Math.abs(this.sprite.originX - pivot.x) > 0.0001 || Math.abs(this.sprite.originY - pivot.y) > 0.0001)) {
      this.sprite.setOrigin(pivot.x, pivot.y);
    }
  }

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
