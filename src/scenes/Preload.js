import Phaser from 'phaser';

const WORLD_ASSETS = [
  ['world-grass', '/assets/world/terrain/grass-tile.svg'],
  ['world-path', '/assets/world/terrain/dirt-path.svg'],
  ['world-water', '/assets/world/terrain/water-tile.svg'],
  ['world-shore', '/assets/world/terrain/water-shore.svg'],
  ['world-tree', '/assets/world/vegetation/tree-canopy.svg'],
  ['world-fern', '/assets/world/vegetation/fern.svg'],
  ['world-rocks', '/assets/world/vegetation/rock-cluster.svg'],
  ['world-flowers', '/assets/world/vegetation/flower-patch.svg']
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
      console.warn('Asset de cenário não carregado:', file.key, file.src);
      label.setText('Carregando recursos restantes...');
    });

    for (const [key, url] of WORLD_ASSETS) {
      this.load.image(key, url);
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
    graphics.clear();

    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('tile', 32, 32);
    this.scene.start('Menu');
  }
}
