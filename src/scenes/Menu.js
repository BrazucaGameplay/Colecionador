import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x0b0f1a).setOrigin(0);

    this.add.text(width / 2, height * 0.32, "CONQUISTADOR DE WAIFU'S", {
      fontFamily: "Arial, sans-serif",
      fontSize: "25px",
      fontStyle: "bold",
      color: "#f8fafc"
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, "A aventura começa aqui", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height * 0.62, 220, 58, 0x22c55e)
      .setStrokeStyle(2, 0x86efac)
      .setInteractive({ useHandCursor: true });

    const label = this.add.text(width / 2, height * 0.62, "JOGAR", {
      fontFamily: "Arial, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#052e16"
    }).setOrigin(0.5);

    button.on("pointerover", () => button.setFillStyle(0x16a34a));
    button.on("pointerout", () => button.setFillStyle(0x22c55e));
    button.on("pointerdown", () => this.scene.start("Game"));
    label.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("Game"));
  }
}
