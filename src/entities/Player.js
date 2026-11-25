import CharacterRenderer3D from './CharacterRenderer3D.js';

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 220;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setVisible(false);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(24, 14);

    this.statusText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2,
      'Carregando personagem...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#0b0f1a',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

    this.renderer = new CharacterRenderer3D(scene, {
      onReady: () => this.statusText?.destroy(),
      onError: (message) => this.statusText?.setText(message)
    });
    this.renderer.setPosition(x, y);
  }

  move(vx, vy) {
    const length = Math.hypot(vx, vy);
    if (length > 0.001) {
      this.sprite.setVelocity((vx / length) * this.speed, (vy / length) * this.speed);
      this.renderer.setMoving(true);
    } else {
      this.sprite.setVelocity(0, 0);
      this.renderer.setMoving(false);
    }
  }

  attack() {
    this.renderer.playSlash();
  }

  jump() {
    this.renderer.playJump();
  }

  die() {
    this.renderer.playDeath();
  }

  update(delta = 16.67, camera = this.scene.cameras.main) {
    this.renderer.setPosition(this.sprite.x, this.sprite.y);
    this.renderer.update(delta, camera);
  }

  destroy() {
    this.statusText?.destroy();
    this.renderer?.destroy();
    this.sprite?.destroy();
  }
}
