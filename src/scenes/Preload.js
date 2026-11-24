import Phaser from 'phaser';
export default class Preload extends Phaser.Scene {
  constructor() { super('Preload'); }
    preload() {
        const w = this.scale.width, h = this.scale.height;
            this.add.rectangle(w / 2, h / 2, 300, 20, 0x222222).setOrigin(.5);
                const fill = this.add.rectangle(w / 2 - 140, h / 2, 0, 12, 0x22c55e).setOrigin(0, .5);
                    const txt = this.add.text(w / 2, h / 2 + 40, 'Carregando... 0%', { fontSize: '16px', color: '#fff' }).setOrigin(.5);
                        this.load.on('progress', p => { fill.width = 280 * p; txt.setText('Carregando... ' + Math.round(p * 100) + '%'); });
                            this.load.on('loaderror', () => { txt.setText('Erro ao carregar. Toque para tentar de novo.'); this.input.once('pointerdown', () => this.scene.restart()); });
                              }
                                create() {
                                    const g = this.make.graphics({ add: false });
                                        g.fillStyle(0x38bdf8, 1); g.fillCircle(16, 16, 14); g.generateTexture('player', 32, 32); g.clear();
                                            g.fillStyle(0xef4444, 1); g.fillCircle(16, 16, 14); g.fillStyle(0x000000, 1); g.fillCircle(11, 12, 3); g.fillCircle(21, 12, 3); g.generateTexture('monster', 32, 32); g.clear();
                                                g.fillStyle(0x22c55e, 1); g.fillRect(0, 0, 32, 32); g.generateTexture('tile', 32, 32);
                                                    this.scene.start('Menu');
                                                      }
                                                      }