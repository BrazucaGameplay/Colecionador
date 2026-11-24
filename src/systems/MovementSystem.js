export default class MovementSystem {
  constructor({ player, inputController, cameraController }) {
    if (!player || typeof player.move !== 'function'
      || !inputController || typeof inputController.getMovementVector !== 'function'
      || !cameraController || !Number.isFinite(cameraController.orientation)) {
      throw new TypeError('Player, input controller and camera controller are required.');
    }

    this.player = player;
    this.inputController = inputController;
    this.cameraController = cameraController;
  }

  update() {
    if (!this.player || !this.inputController || !this.cameraController) {
      return { x: 0, y: 0 };
    }

    const movement = this.inputController.getMovementVector(
      this.cameraController.orientation
    );
    this.player.move(movement.x, movement.y);
    return movement;
  }

  destroy() {
    this.player = null;
    this.inputController = null;
    this.cameraController = null;
  }
}
