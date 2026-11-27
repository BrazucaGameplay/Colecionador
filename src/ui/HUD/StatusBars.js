/** Placeholder bars; replace with supplied image assets after upload. */
export default class StatusBars {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.create();
    this.layout();
  }

  keep(object) {
    this.objects.push(object);
    return object;
  }

  create() {
    const scene = this.scene;
    this.hpLabel = this.keep(scene.add.text(0, 0, 'HP', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#ffe4df'
    }).setScrollFactor(0).setDepth(3003));
    this.energyLabel = this.keep(scene.add.text(0, 0, 'EN', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#dbeafe'
    }).setScrollFactor(0).setDepth(3003));
    this.hpTrack = this.keep(scene.add.rectangle(0, 0, 150, 12, 0x25151b, 0.96)
      .setStrokeStyle(1, 0xb98b72).setScrollFactor(0).setDepth(3001));
    this.hpFill = this.keep(scene.add.rectangle(0, 0, 146, 8, 0xd83b43)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(3002));
    this.energyTrack = this.keep(scene.add.rectangle(0, 0, 150, 12, 0x101d31, 0.96)
      .setStrokeStyle(1, 0x7895b5).setScrollFactor(0).setDepth(3001));
    this.energyFill = this.keep(scene.add.rectangle(0, 0, 146, 8, 0x3985d6)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(3002));
  }

  layout() {
    if (!this.scene || !this.hpTrack) return;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const barWidth = Math.min(150, Math.max(96, width * 0.34));
    const left = (width - barWidth) / 2;
    const top = height - 32;
    this.hpTrack.setPosition(width / 2, top - 8).setSize(barWidth, 12);
    this.energyTrack.setPosition(width / 2, top + 8).setSize(barWidth, 12);
    this.hpFill.setPosition(left + 2, top - 8).setSize(Math.max(0, barWidth - 4), 8);
    this.energyFill.setPosition(left + 2, top + 8).setSize(Math.max(0, barWidth - 4), 8);
    this.hpLabel.setPosition(left - 23, top - 14);
    this.energyLabel.setPosition(left - 23, top + 2);
    this.barLeft = left - 28;
    this.barRight = left + barWidth + 4;
  }

  setValues(health, maxHealth, energy, maxEnergy) {
    const hp = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
    const en = maxEnergy > 0 ? Math.max(0, Math.min(1, energy / maxEnergy)) : 0;
    const width = this.hpTrack.width;
    this.hpFill.setSize(Math.max(0, (width - 4) * hp), 8);
    this.energyFill.setSize(Math.max(0, (width - 4) * en), 8);
  }

  containsScreenPoint(x, y) {
    return Boolean(this.scene) && x >= (this.barLeft ?? 0) && x <= (this.barRight ?? 0) &&
      y >= this.scene.scale.height - 56 && y <= this.scene.scale.height;
  }

  destroy() {
    for (const object of this.objects) object?.destroy();
    this.objects.length = 0;
    this.scene = null;
  }
}
