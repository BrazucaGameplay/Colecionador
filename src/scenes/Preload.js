import Phaser from 'phaser';

const WORLD_ASSETS = [
  // Silhueta original da ilha: define o tamanho do mundo e a área caminhável.
  ['island-01', 'assets/world/Islands/island-01.png'],
  // Textura de terreno em alta resolução, repetida por código para preencher a silhueta.
  ['island-ground-tile', 'assets/world/Islands/island-01/ground/terreno-01.png'],
  // Árvores em camada independente do terreno.
  ['tree-large', 'assets/world/vegetation/arvore_1.png'],
  ['tree-flowering', 'assets/world/vegetation/arvore_2.png']
];

export default class Preload extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 140, height / 2, 0, 12, 0x22c55e).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 40, 'Carregando mundo... 0%', {
      fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (progress) => {
      fill.width = 280 * progress;
      label.setText('Carregando mundo... ' + Math.round(progress * 100) + '%');
    });
    this.load.on('loaderror', (file) => {
      console.error('Falha ao carregar asset final:', file.key, file.src);
      label.setText('Falha ao carregar recursos do jogo.');
    });
    for (const [key, url] of WORLD_ASSETS) {
      this.load.image(key, import.meta.env.BASE_URL + url + '?v=20261125-trees-01');
    }
  }

  create() {
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 0);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('player', 2, 2);
    graphics.destroy();

    const monsterGraphics = this.make.graphics({ add: false });
    monsterGraphics.fillStyle(0xef4444, 1);
    monsterGraphics.fillCircle(16, 16, 14);
    monsterGraphics.fillStyle(0x000000, 1);
    monsterGraphics.fillCircle(11, 12, 3);
    monsterGraphics.fillCircle(21, 12, 3);
    monsterGraphics.generateTexture('monster', 32, 32);
    monsterGraphics.destroy();
    this.scene.start('Menu');
  }
}
