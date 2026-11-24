import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 140, height / 2, 0, 12, 0x22c55e)
      .setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 40, 'Carregando... 0%', {
      fontSize: '16px',
      color: '#fff'
    }).setOrigin(0.5);

    this.load.on('progress', progress => {
      fill.width = 280 * progress;
      label.setText('Carregando... ' + Math.round(progress * 100) + '%');
    });

    this.load.on('loaderror', () => {
      label.setText('Erro ao carregar. Toque para tentar de novo.');
      this.input.once('pointerdown', () => this.scene.restart());
    });
  }

  create() {
    const graphics = this.make.graphics({ add: false });

    // Formas vetoriais provisórias para testes de cena; nao sao assets finais.
    graphics.fillStyle(0x38bdf8, 1);
    graphics.fillCircle(24, 24, 21);
    graphics.generateTexture('player', 48, 48);
    graphics.clear();

    graphics.fillStyle(0xef4444, 1);
    graphics.fillCircle(24, 24, 21);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(17, 19, 4);
    graphics.fillCircle(31, 19, 4);
    graphics.generateTexture('monster', 48, 48);
    graphics.clear();

    // Losango isometrico vetorial temporario para validar coordenadas e camera.
    graphics.fillStyle(0x34785a, 1);
    graphics.fillTriangle(32, 0, 64, 16, 32, 32);
    graphics.fillStyle(0x438d68, 1);
    graphics.fillTriangle(32, 0, 32, 32, 0, 16);
    graphics.lineStyle(2, 0x1d4d3a, 0.85);
    graphics.lineBetween(32, 0, 64, 16);
    graphics.lineBetween(64, 16, 32, 32);
    graphics.lineBetween(32, 32, 0, 16);
    graphics.lineBetween(0, 16, 32, 0);
    graphics.generateTexture('tile', 64, 32);
    graphics.destroy();

    this.scene.start('Menu');
  }
}
