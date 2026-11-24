export default class CameraControls {
  constructor(scene, cameraController) {
    if (!scene?.add || !scene?.input?.keyboard || !cameraController) {
      throw new TypeError('Scene, keyboard input and camera controller are required.');
    }

    this.scene = scene;
    this.cameraController = cameraController;
    this.objects = [];
    this.onRotateLeft = () => this.cameraController.rotateQuarterTurn(-1);
    this.onRotateRight = () => this.cameraController.rotateQuarterTurn(1);

    const right = scene.scale.width - 36;
    const left = scene.scale.width - 84;
    const y = 34;

    this.createButton(left, y, '↶', -1);
    this.createButton(right, y, '↷', 1);

    scene.input.keyboard.on('keydown-Q', this.onRotateLeft);
    scene.input.keyboard.on('keydown-E', this.onRotateRight);
  }

  createButton(x, y, label, direction) {
    const background = this.scene.add.circle(x, y, 19, 0x111827, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.65)
      .setScrollFactor(0)
      .setDepth(100);

    const text = this.scene.add.text(x, y, label, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.cameraController.rotateQuarterTurn(direction));
    this.objects.push(background, text);
  }

  destroy() {
    if (!this.scene) return;
    this.scene.input.keyboard.off('keydown-Q', this.onRotateLeft);
    this.scene.input.keyboard.off('keydown-E', this.onRotateRight);
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.scene = null;
    this.cameraController = null;
  }
}
