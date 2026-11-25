export default class Monster {
  constructor(scene, x, y) {
    this.scene = scene;
    this.spawn = { x, y };
    this.maxHp = 2;
    this.hp = this.maxHp;
    this.dead = false;
    this.nextMoveAt = 0;
    this.sprite = scene.physics.add.sprite(x, y, 'monster');
    this.sprite.setCollideWorldBounds(true);
  }

  takeHit() {
    if (this.dead) return;
    this.hp -= 1;
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.4,
      duration: 80,
      yoyo: true
    });

    if (this.hp <= 0) {
      this.dead = true;
      this.sprite.setVelocity(0, 0).setVisible(false);
    }
  }

  respawn() {
    this.hp = this.maxHp;
    this.dead = false;
    this.sprite.setPosition(this.spawn.x, this.spawn.y);
    this.sprite.setScale(1);
    this.sprite.setVisible(true);
    this.nextMoveAt = 0;
  }

  update(now) {
    if (this.dead || now < this.nextMoveAt) return;
    this.nextMoveAt = now + 800 + Math.random() * 800;
    const angle = Math.random() * Math.PI * 2;
    this.sprite.setVelocity(Math.cos(angle) * 60, Math.sin(angle) * 60);
  }

  destroy() {
    this.sprite?.destroy();
    this.sprite = null;
    this.scene = null;
  }
}
