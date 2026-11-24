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
    this.onZoomOut = () => this.cameraController.adjustZoom(-this.cameraController.config.zoom.step);
    this.onZoomIn = () => this.cameraController.adjustZoom(this.cameraController.config.zoom.step);

    const right = scene.scale.width - 36;
    const positions = [
      { x: right - 144, label: '−', action: this.onZoomOut },
      { x: right - 96, label: '+', action: this.onZoomIn },
      { x: right - 48, label: '↶', action: this.onRotateLeft },
      { x: right, label: '↷', action: this.onRotateRight }
    ];

    for (const button of positions) {
      this.createButton(button.x, 34, button.label, button.action);
    }

    scene.input.keyboard.on('keydown-Q', this.onRotateLeft);
    scene.input.keyboard.on('keydown-E', this.onRotateRight);
    scene.input.keyboard.on('keydown-MINUS', this.onZoomOut);
    scene.input.keyboard.on('keydown-PLUS', this.onZoomIn);
  }

  createButton(x, y, label, action) {
    const background = this.scene.add.circle(x, y, 19, 0x111827, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.65)
      .setScrollFactor(0)
      .setDepth(100);

    const text = this.scene.add.text(x, y, label, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', action);
    this.objects.push(background, text);
  }

  destroy() {
    if (!this.scene) return;
    const keyboard = this.scene.input.keyboard;
    keyboard.off('keydown-Q', this.onRotateLeft);
    keyboard.off('keydown-E', this.onRotateRight);
    keyboard.off('keydown-MINUS', this.onZoomOut);
    keyboard.off('keydown-PLUS', this.onZoomIn);
    for (const object of this.objects) object.destroy();
    this.objects.length = 0;
    this.scene = null;
    this.cameraController = null;
  }
}
