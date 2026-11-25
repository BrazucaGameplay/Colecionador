import CharacterRenderer3D from './CharacterRenderer3D.js';

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 220;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setVisible(false);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(24, 14);

    this.loadingCover = scene.add.rectangle(
      0, 0, scene.scale.width, scene.scale.height, 0x0b0f1a, 1
    ).setOrigin(0).setScrollFactor(0).setDepth(10000);

    this.statusText = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height / 2,
      'Carregando personagem 3D...\\nPreparando modelo',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
        backgroundColor: '#111827',
        padding: { x: 16, y: 12 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    this.onScaleResize = (gameSize) => {
      this.loadingCover?.setSize(gameSize.width, gameSize.height);
      this.statusText?.setPosition(gameSize.width / 2, gameSize.height / 2);
    };
    scene.scale.on('resize', this.onScaleResize);

    this.renderer = new CharacterRenderer3D(scene, {
      onReady: () => {
        this.loadingCover?.destroy();
        this.statusText?.destroy();
        this.loadingCover = null;
        this.statusText = null;
      },
      onProgress: ({ loaded, total, ratio }) => {
        if (!this.statusText) return;
        const loadedText = (loaded / 1048576).toFixed(1);
        const totalText = total > 0 ? ` / ${(total / 1048576).toFixed(1)} MB` : ' MB';
        const percent = ratio === null ? '' : ` (${Math.round(ratio * 100)}%)`;
        this.statusText.setText(
          `Carregando personagem 3D...\\n${loadedText}${totalText}${percent}`
        );
      },
      onError: (message) => {
        this.statusText?.setText(`Não foi possível iniciar o jogador.\\n${message}`);
      }
    });

    this.renderer.setPosition(x, y);
  }

  move(vx, vy) {
    const length = Math.hypot(vx, vy);
    if (length > 0.001) {
      const normalizedX = vx / length;
      const normalizedY = vy / length;
      this.sprite.setVelocity(normalizedX * this.speed, normalizedY * this.speed);
      this.renderer.setDirection(Math.atan2(normalizedX, -normalizedY));
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
    this.sprite.setVelocity(0, 0);
  }

  update(delta = 16.67, camera = this.scene.cameras.main) {
    this.renderer.setPosition(this.sprite.x, this.sprite.y);
    this.renderer.update(delta, camera);
  }

  destroy() {
    this.scene.scale.off('resize', this.onScaleResize);
    this.loadingCover?.destroy();
    this.statusText?.destroy();
    this.renderer?.destroy();
    this.sprite?.destroy();
    this.scene = null;
  }
}
