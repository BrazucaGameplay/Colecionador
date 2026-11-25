import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import WorldNavigation from '../world/WorldNavigation.js';
import MovementController from '../systems/MovementController.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.28, max: 2.25, fitPadding: 0.94 });
const TAP_MOVE_THRESHOLD = 12;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.pointers = new Map();
    this.gesture = null;
    this.worldObjects = [];
    this.groundTiles = [];
  }

  create() {
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    const islandSource = this.textures.get('island-01').getSourceImage();
    this.worldWidth = islandSource.width;
    this.worldHeight = islandSource.height;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.navigation = new WorldNavigation(this.worldWidth, this.worldHeight);
    this.createGround();
    this.createIslandWalkableMask(islandSource);

    const playerSpawn = this.navigation.findNearestWalkablePoint(centerX, centerY);
    if (!playerSpawn) {
      throw new Error('Não foi encontrado um ponto caminhável para iniciar o jogador.');
    }

    this.player = new Player(this, playerSpawn.x, playerSpawn.y);
    const monsterSpawn = this.navigation.findNearestWalkablePoint(centerX - 180, centerY - 105);
    const enemySpawn = monsterSpawn || { x: playerSpawn.x + 90, y: playerSpawn.y };
    this.monster = new Monster(this, enemySpawn.x, enemySpawn.y);
    this.physics.add.overlap(this.player.sprite, this.monster.sprite, () => this.hitMonster());

    this.hp = 3;
    this.hpText = this.add.text(16, 16, 'HP ' + this.hp, {
      fontSize: '20px',
      color: '#fff',
      stroke: '#172719',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(1000);

    this.score = 0;
    this.scoreText = this.add.text(16, 44, 'Monstros: ' + this.score, {
      fontSize: '18px',
      color: '#fff',
      stroke: '#172719',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(1000);

    this.camera = this.cameras.main;
    this.fitZoom = Math.min(
      viewWidth / this.worldWidth,
      viewHeight / this.worldHeight
    ) * CAMERA_ZOOM.fitPadding;
    this.camera.setZoom(Math.max(CAMERA_ZOOM.min, this.fitZoom));

    const viewportWorldWidth = this.camera.width / this.camera.zoom;
    const viewportWorldHeight = this.camera.height / this.camera.zoom;
    const panMarginX = Math.max(160, viewportWorldWidth);
    const panMarginY = Math.max(160, viewportWorldHeight);
    this.camera.setBounds(
      -panMarginX,
      -panMarginY,
      this.worldWidth + panMarginX * 2,
      this.worldHeight + panMarginY * 2
    );
    this.camera.centerOn(centerX, centerY);

    this.destinationMarker = this.add.circle(0, 0, 12, 0xfacc15, 0.18)
      .setStrokeStyle(2, 0xfacc15, 0.95)
      .setDepth(900)
      .setVisible(false);

    this.movement = new MovementController(
      this,
      this.player,
      this.navigation,
      this.destinationMarker
    );

    this.input.addPointer(1);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
  }

  createGround() {
    const island = this.add.image(
      this.worldWidth / 2,
      this.worldHeight / 2,
      'island-01'
    ).setOrigin(0.5, 0.5).setDepth(-1000);
    this.groundTiles.push(island);
  }

  createIslandWalkableMask(source) {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    this.navigation.setAlphaMask(pixels, source.width, source.height, 150);
  }

  onPointerDown(pointer) {
    this.pointers.set(pointer.id, {
      x: pointer.x,
      y: pointer.y,
      startX: pointer.x,
      startY: pointer.y,
      moved: false
    });

    if (this.pointers.size === 1) {
      this.gesture = {
        type: 'pending',
        pointerId: pointer.id,
        lastX: pointer.x,
        lastY: pointer.y
      };
    } else if (this.pointers.size === 2) {
      const points = [...this.pointers.values()];
      this.gesture = {
        type: 'pinch',
        startDistance: Phaser.Math.Distance.Between(
          points[0].x, points[0].y, points[1].x, points[1].y
        ),
        startZoom: this.camera.zoom
      };
    }
  }

  onPointerMove(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;
    point.x = pointer.x;
    point.y = pointer.y;
    if (Math.hypot(pointer.x - point.startX, pointer.y - point.startY) > TAP_MOVE_THRESHOLD) {
      point.moved = true;
    }

    if (this.pointers.size >= 2) {
      const points = [...this.pointers.values()];
      const distance = Phaser.Math.Distance.Between(
        points[0].x, points[0].y, points[1].x, points[1].y
      );
      if (this.gesture?.type === 'pinch' && this.gesture.startDistance > 0) {
        this.camera.setZoom(Phaser.Math.Clamp(
          this.gesture.startZoom * distance / this.gesture.startDistance,
          CAMERA_ZOOM.min,
          CAMERA_ZOOM.max
        ));
      }
      return;
    }

    if (this.gesture?.pointerId !== pointer.id || !point.moved) return;
    this.gesture.type = 'pan';
    this.camera.scrollX -= (pointer.x - this.gesture.lastX) / this.camera.zoom;
    this.camera.scrollY -= (pointer.y - this.gesture.lastY) / this.camera.zoom;
    this.gesture.lastX = pointer.x;
    this.gesture.lastY = pointer.y;
  }

  onPointerUp(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;
    const wasTap = this.pointers.size === 1 &&
      !point.moved &&
      this.gesture?.type === 'pending';

    if (wasTap) {
      const destination = this.camera.getWorldPoint(pointer.x, pointer.y);
      this.movement.setDestination(destination.x, destination.y);
    }

    this.pointers.delete(pointer.id);
    if (this.pointers.size === 0) {
      this.gesture = null;
    } else if (this.pointers.size === 1) {
      const remaining = [...this.pointers.entries()][0];
      this.gesture = {
        type: 'pending',
        pointerId: remaining[0],
        lastX: remaining[1].x,
        lastY: remaining[1].y
      };
      remaining[1].startX = remaining[1].x;
      remaining[1].startY = remaining[1].y;
      remaining[1].moved = true;
    }
  }

  hitMonster() {
    if (this._cooldown > this.time.now || this.monster.dead) return;
    this._cooldown = this.time.now + 500;
    this.player.attack();
    this.monster.takeHit();

    if (this.monster.dead) {
      this.score += 1;
      this.scoreText.setText('Monstros: ' + this.score);
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ score: this.score, at: Date.now() })
        );
      } catch (error) {
        console.warn('Não foi possível salvar o progresso neste dispositivo.', error);
      }
      this.time.delayedCall(600, () => {
        if (this.monster && !this.monster.scene) return;
        this.monster?.respawn();
      });
    }
  }

  update(time, delta = 16.67) {
    this.movement?.update(delta);
    this.player?.update(delta, this.camera);
    this.monster?.update(this.time.now);

    if (this.monster && !this.monster.dead) {
      const seconds = Math.min(Math.max(delta, 0), 50) / 1000;
      const nextX = this.monster.sprite.x + this.monster.sprite.body.velocity.x * seconds;
      const nextY = this.monster.sprite.y + this.monster.sprite.body.velocity.y * seconds;
      if (!this.navigation.isAreaWalkable(nextX, nextY, 12)) {
        this.monster.sprite.setVelocity(0, 0);
      }
      this.monster.sprite.setDepth(this.monster.sprite.y + 20);
    }

    if (this.player) this.player.sprite.setDepth(this.player.sprite.y + 20);
    for (const object of this.worldObjects) object.setDepth(object.y);
  }

  shutdown() {
    this.movement?.destroy();
    this.player?.destroy();
    this.monster?.destroy();
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.off('pointerupoutside', this.onPointerUp, this);
    this.pointers.clear();
    this.gesture = null;
    this.worldObjects.length = 0;
    this.groundTiles.length = 0;
    this.movement = null;
    this.player = null;
    this.monster = null;
  }
}
