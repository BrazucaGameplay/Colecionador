export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 220;

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

  move(vx, vy) {
    const len = Math.hypot(vx, vy) || 1;
    this.sprite.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);

    if (vx < 0) this.visual.setFlipX(true);
    else if (vx > 0) this.visual.setFlipX(false);
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
