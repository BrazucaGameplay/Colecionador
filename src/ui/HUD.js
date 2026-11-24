export default class HUD {
  constructor(scene, { hp = 3, score = 0 } = {}) {
    if (!scene?.add) throw new TypeError('A Phaser scene is required.');
    this.scene = scene;
    this.hp = hp;
    this.score = score;

    this.hpText = scene.add.text(16, 16, 'HP ' + hp, {
      fontSize: '20px',
      color: '#fff'
    }).setScrollFactor(0);

    this.scoreText = scene.add.text(16, 44, 'Monstros: ' + score, {
      fontSize: '18px',
      color: '#fff'
    }).setScrollFactor(0);

    this.objects = [this.hpText, this.scoreText];
  }

  setScore(score) {
    if (!Number.isSafeInteger(score) || score < 0) {
      throw new TypeError('HUD score must be a non-negative safe integer.');
    }
    this.score = score;
    this.scoreText.setText('Monstros: ' + score);
  }

  destroy() {
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.scene = null;
  }
}
