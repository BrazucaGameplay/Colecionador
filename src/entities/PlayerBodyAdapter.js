/**
 * Phaser Arcade body adapter for the logical Player.
 * It is invisible and contains no character art or animation.
 */
export default class PlayerBodyAdapter {
  constructor(scene, player, { radius = 10 } = {}) {
    this.player = player;
    this.object = scene.add.zone(player.x, player.y, radius * 2, radius * 2);
    scene.physics.add.existing(this.object);
    this.object.setVisible(false);
    this.object.body.setCircle(radius);
    this.object.body.setAllowGravity(false);
    this.object.body.setImmovable(true);
    this.sync();
  }

  sync() {
    if (!this.object || !this.player) return;
    this.object.setPosition(this.player.x, this.player.y);
    this.object.body?.reset(this.player.x, this.player.y);
  }

  destroy() {
    this.object?.destroy();
    this.object = null;
    this.player = null;
  }
}
