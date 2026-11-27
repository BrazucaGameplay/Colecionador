/** Uploaded double-bar frame with live HP and energy overlays. */
export default class StatusBars {
  constructor(scene) {
    this.scene = scene;
    this.create();
    this.layout();
  }

  create() {
    this.frame = this.scene.add.image(0, 0, 'ui-hud-status').setScrollFactor(0).setDepth(3001);
    this.hpFill = this.scene.add.rectangle(0, 0, 0, 1, 0xe33b45)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(3002);
    this.energyFill = this.scene.add.rectangle(0, 0, 0, 1, 0x3288df)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(3002);
    this.healthRatio = 1;
    this.energyRatio = 1;
  }

  layout() {
    if (!this.scene || !this.frame) return;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    this.displayWidth = Math.min(320, screenWidth * 0.82);
    this.displayHeight = this.displayWidth * 201 / 600;
    this.left = (screenWidth - this.displayWidth) / 2;
    this.top = screenHeight - this.displayHeight - 6;
    this.scaleX = this.displayWidth / 600;
    this.scaleY = this.displayHeight / 201;
    this.frame.setPosition(screenWidth / 2, this.top + this.displayHeight / 2)
      .setDisplaySize(this.displayWidth, this.displayHeight);

    // Interior tracks measured in the source artwork's 600 x 201 coordinate space.
    this.hpX = this.left + 140 * this.scaleX;
    this.hpY = this.top + 78 * this.scaleY;
    this.hpMaxWidth = 365 * this.scaleX;
    this.hpHeight = 17 * this.scaleY;
    this.energyX = this.left + 140 * this.scaleX;
    this.energyY = this.top + 127 * this.scaleY;
    this.energyMaxWidth = 365 * this.scaleX;
    this.energyHeight = 20 * this.scaleY;
    this.setValues(this.healthRatio, 1, this.energyRatio, 1);
  }

  setValues(health, maxHealth, energy, maxEnergy) {
    this.healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
    this.energyRatio = maxEnergy > 0 ? Math.max(0, Math.min(1, energy / maxEnergy)) : 0;
    if (!this.hpFill || !this.energyFill || !this.hpMaxWidth) return;
    this.hpFill.setPosition(this.hpX, this.hpY).setSize(this.hpMaxWidth * this.healthRatio, this.hpHeight);
    this.energyFill.setPosition(this.energyX, this.energyY).setSize(this.energyMaxWidth * this.energyRatio, this.energyHeight);
  }

  containsScreenPoint(x, y) {
    return Boolean(this.scene) && x >= this.left && x <= this.left + this.displayWidth &&
      y >= this.top && y <= this.top + this.displayHeight;
  }

  destroy() {
    this.frame?.destroy();
    this.hpFill?.destroy();
    this.energyFill?.destroy();
    this.frame = null;
    this.hpFill = null;
    this.energyFill = null;
    this.scene = null;
  }
}
