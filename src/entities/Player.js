export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 220;
    this.currentAnimation = 'idle';

    // Arcade body handles collision/navigation; Rigby is the visible character.
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setVisible(false);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(24, 14);

    this.visual = scene.add.rigby(x, y, 'nila', 'idle', true);
    this.visual.setScale(0.04);
    this.visual.setOrigin(0.5, 1);
    this.visual.setDepth(y + 20);
  }

  setAnimation(name) {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.visual.play(name, true, 0.12);
  }

  move(vx, vy) {
    const len = Math.hypot(vx, vy);
    if (len > 0.001) {
      this.sprite.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
      this.setAnimation('walk');
      if (vx < 0) this.visual.setFlipX(true);
      else if (vx > 0) this.visual.setFlipX(false);
    } else {
      this.sprite.setVelocity(0, 0);
      this.setAnimation('idle');
    }
  }

  update() {
    this.visual.setPosition(this.sprite.x, this.sprite.y);
    this.visual.setDepth(this.sprite.y + 20);
  }

  destroy() {
    this.visual?.destroy();
    this.sprite?.destroy();
  }
}
