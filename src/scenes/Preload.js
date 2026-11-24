import Phaser from 'phaser';

const WORLD_ASSETS = [
  ['island-01', 'assets/world/Islands/island-01.png']
];

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 140, height / 2, 0, 12, 0x22c55e).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 40, 'Carregando mundo... 0%', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (progress) => {
      fill.width = 280 * progress;
      label.setText('Carregando mundo... ' + Math.round(progress * 100) + '%');
    });

    this.load.on('loaderror', (file) => {
      console.error('Falha ao carregar asset final:', file.key, file.src);
      label.setText('Falha ao carregar recursos do mundo.');
    });

    for (const [key, url] of WORLD_ASSETS) {
      this.load.image(key, import.meta.env.BASE_URL + url + '?v=20261124-3');
    }
  }

  create() {
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0x38bdf8, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.generateTexture('player', 32, 32);
    graphics.clear();

    graphics.fillStyle(0xef4444, 1);
    graphics.fillCircle(16, 16, 14);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(11, 12, 3);
    graphics.fillCircle(21, 12, 3);
    graphics.generateTexture('monster', 32, 32);
    this.scene.start('Menu');
  }
}
