/**
 * Corpo Arcade invisível. A entidade lógica continua sendo a fonte do estado.
 */
export default class MonsterBodyAdapter {
  constructor(scene, monster, { radius = 12 } = {}) {
    if (!scene?.physics?.add?.existing || !monster) {
      throw new TypeError('MonsterBodyAdapter exige Scene Arcade e Monster.');
    }

    this.monster = monster;
    this.zone = scene.add.zone(monster.x, monster.y, radius * 2, radius * 2);
    scene.physics.add.existing(this.zone);
    this.zone.setVisible(false);
    this.zone.body.setCircle(radius);
    this.zone.body.setAllowGravity(false);
    this.zone.body.setImmovable(true);
    this.zone.body.setCollideWorldBounds(true);
    this.sync();
  }

  sync() {
    if (!this.zone || !this.monster || !this.zone.body) return;
    this.zone.setPosition(this.monster.x, this.monster.y);
    this.zone.body.reset(this.monster.x, this.monster.y);
  }

  setEnabled(enabled) {
    if (this.zone?.body) this.zone.body.enable = Boolean(enabled);
    this.zone?.setActive(Boolean(enabled));
  }

  destroy() {
    this.zone?.destroy();
    this.zone = null;
    this.monster = null;
  }
}
