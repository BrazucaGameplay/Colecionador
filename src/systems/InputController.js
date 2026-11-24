import TouchControls from './touch.js';

export default class InputController {
  constructor(scene) {
    this.touch = new TouchControls(scene);
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys('W,A,S,D');
    this.destroyed = false;
  }

  getMovementVector() {
    if (this.destroyed) return { x: 0, y: 0 };
    const vector = { x: this.touch.vector.x, y: this.touch.vector.y };
    if (this.cursors.left.isDown || this.wasd.A.isDown) vector.x = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vector.x = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vector.y = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vector.y = 1;
    return vector;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.touch.destroy();
  }
}
