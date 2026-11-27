import { CHARACTER_ANIMATIONS } from '../../rendering/characters/CharacterAnimationCatalog.js';

/** Small, transparent player silhouette that opens the character profile. */
export default class PlayerPortrait {
  constructor(scene, { onClick = () => {} } = {}) {
    this.scene = scene;
    this.width = 42;
    this.height = 54;
    const idle = CHARACTER_ANIMATIONS.idle;
    this.sprite = scene.add.sprite(0, 0, idle.key, 'd0-f0')
      .setDisplaySize(this.width, this.height)
      .setTint(0x32120f)
      .setAlpha(0.96)
      .setScrollFactor(0)
      .setDepth(3004)
      .setInteractive();
    this.pointerHandler = (pointer, localX, localY, event) => {
      event?.stopPropagation();
      onClick();
    };
    this.sprite.on('pointerdown', this.pointerHandler);
  }

  layout(statusBars) {
    if (!this.scene || !this.sprite) return;
    const x = statusBars ? statusBars.left + 34 : 42;
    const y = statusBars ? statusBars.top - 29 : this.scene.scale.height - 90;
    this.sprite.setPosition(x, y);
  }

  containsScreenPoint(x, y) {
    return Boolean(this.sprite) &&
      Math.abs(x - this.sprite.x) <= this.width / 2 + 8 &&
      Math.abs(y - this.sprite.y) <= this.height / 2 + 8;
  }

  destroy() {
    this.sprite?.off('pointerdown', this.pointerHandler);
    this.sprite?.destroy();
    this.sprite = null;
    this.scene = null;
  }
}
