import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.65, max: 2.25, initial: 1 });
const TAP_MOVE_THRESHOLD = 12;
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.pointers = new Map();
    this.destination = null;
    this.gesture = null;
    this.worldObjects = [];
  }

  create() {
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    this.worldWidth = Math.max(1280, Math.ceil((viewWidth * 2) / TILE_WIDTH) * TILE_WIDTH);
    this.worldHeight = Math.max(960, Math.ceil((viewHeight * 2) / TILE_HEIGHT) * TILE_HEIGHT);
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.createGround();
    this.createWorldDecorations(centerX, centerY);

    this.player = new Player(this, centerX, centerY + 70);
    this.monster = new Monster(this, centerX - 180, centerY - 110);
    this.physics.add.overlap(this.player.sprite, this.monster.sprite, () => this.hitMonster());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

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
    this.camera.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.camera.setZoom(CAMERA_ZOOM.initial);
    this.camera.centerOn(centerX, centerY);

    this.destinationMarker = this.add.circle(0, 0, 12, 0xfacc15, 0.18)
      .setStrokeStyle(2, 0xfacc15, 0.95)
      .setDepth(900)
      .setVisible(false);

    this.input.addPointer(1);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
  }

  createGround() {
    const graphics = this.add.graphics().setDepth(-1000);
    graphics.fillStyle(0x477d32, 1);
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight);

    const rows = Math.ceil(this.worldHeight / (TILE_HEIGHT / 2)) + 2;
    const columns = Math.ceil(this.worldWidth / TILE_WIDTH) + 2;
    for (let row = -1; row < rows; row++) {
      for (let column = -1; column < columns; column++) {
        const x = column * TILE_WIDTH + ((row & 1) ? TILE_WIDTH / 2 : 0);
        const y = row * (TILE_HEIGHT / 2);
        const shade = ((column * 13 + row * 7) % 5 + 5) % 5;
        const colors = [0x57943a, 0x5b983d, 0x528d36, 0x609d42, 0x558f38];
        graphics.fillStyle(colors[shade], 1);
        graphics.lineStyle(1, 0x3f7c32, 0.22);
        graphics.beginPath();
        graphics.moveTo(x, y - TILE_HEIGHT / 2);
        graphics.lineTo(x + TILE_WIDTH / 2, y);
        graphics.lineTo(x, y + TILE_HEIGHT / 2);
        graphics.lineTo(x - TILE_WIDTH / 2, y);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
      }
    }

    // Small, restrained ground highlights add texture without replacing the
    // authored transparent props or creating a distracting debug grid.
    for (let i = 0; i < 240; i++) {
      const x = Phaser.Math.Between(24, this.worldWidth - 24);
      const y = Phaser.Math.Between(24, this.worldHeight - 24);
      graphics.fillStyle(i % 3 === 0 ? 0x9acb58 : 0x315f2d, 0.22);
      graphics.fillEllipse(x, y, Phaser.Math.Between(2, 5), 2);
    }
  }

  createWorldDecorations(centerX, centerY) {
    const addProp = (key, x, y, width, depthOffset = 0) => {
      if (!this.textures.exists(key)) return null;
      const image = this.add.image(x, y, key);
      image.setDisplaySize(width, width * (image.height / image.width));
      image.setOrigin(0.5, 0.88);
      image.setDepth(y + depthOffset);
      this.worldObjects.push(image);
      return image;
    };

    // Water and shore form a single landmark at the edge of the initial clearing.
    addProp('world-water', centerX + 360, centerY - 180, 190, -2);
    addProp('world-shore', centerX + 300, centerY - 135, 190, -1);

    // A clear central corridor is intentionally preserved for movement and combat.
    addProp('world-tree', centerX - 310, centerY - 210, 190);
    addProp('world-tree', centerX + 390, centerY + 170, 160);
    addProp('world-rocks', centerX - 360, centerY + 170, 125);
    addProp('world-rocks', centerX + 260, centerY - 280, 110);
    addProp('world-fern', centerX - 210, centerY + 260, 92);
    addProp('world-fern', centerX + 160, centerY + 250, 82);
    addProp('world-flowers', centerX - 70, centerY - 250, 115);
    addProp('world-flowers', centerX + 360, centerY + 10, 100);
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
        startDistance: Phaser.Math.Distance.Between(points[0].x, points[0].y, points[1].x, points[1].y),
        startZoom: this.camera.zoom
      };
    }
  }

  onPointerMove(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;
    point.x = pointer.x;
    point.y = pointer.y;
    if (Math.hypot(pointer.x - point.startX, pointer.y - point.startY) > TAP_MOVE_THRESHOLD) point.moved = true;

    if (this.pointers.size >= 2) {
      const points = [...this.pointers.values()];
      const distance = Phaser.Math.Distance.Between(points[0].x, points[0].y, points[1].x, points[1].y);
      if (this.gesture?.type === 'pinch' && this.gesture.startDistance > 0) {
        this.camera.setZoom(Phaser.Math.Clamp(this.gesture.startZoom * distance / this.gesture.startDistance, CAMERA_ZOOM.min, CAMERA_ZOOM.max));
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
    const wasTap = this.pointers.size === 1 && !point.moved && this.gesture?.type === 'pending';
    if (wasTap) {
      const destination = this.camera.getWorldPoint(pointer.x, pointer.y);
      this.setDestination(destination.x, destination.y);
    }

    this.pointers.delete(pointer.id);
    if (this.pointers.size === 0) {
      this.gesture = null;
    } else if (this.pointers.size === 1) {
      const remaining = [...this.pointers.entries()][0];
      this.gesture = { type: 'pending', pointerId: remaining[0], lastX: remaining[1].x, lastY: remaining[1].y };
      remaining[1].startX = remaining[1].x;
      remaining[1].startY = remaining[1].y;
      remaining[1].moved = true;
    }
  }

  setDestination(x, y) {
    const bounds = this.physics.world.bounds;
    const targetX = Phaser.Math.Clamp(x, bounds.x + 12, bounds.right - 12);
    const targetY = Phaser.Math.Clamp(y, bounds.y + 12, bounds.bottom - 12);
    this.destination = { x: targetX, y: targetY };
    this.destinationMarker.setPosition(targetX, targetY).setVisible(true);
  }

  hitMonster() {
    if (this._cooldown > this.time.now) return;
    this._cooldown = this.time.now + 500;
    this.monster.takeHit();
    if (this.monster.dead) {
      this.score++;
      this.scoreText.setText('Monstros: ' + this.score);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ score: this.score, at: Date.now() }));
      } catch (error) {
        console.warn('Não foi possível salvar o progresso neste dispositivo.', error);
      }
      this.time.delayedCall(600, () => this.monster.respawn());
    }
  }

  update() {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

    if (vx !== 0 || vy !== 0) {
      this.destination = null;
      this.destinationMarker.setVisible(false);
    } else if (this.destination) {
      const dx = this.destination.x - this.player.sprite.x;
      const dy = this.destination.y - this.player.sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 7) {
        this.destination = null;
        this.destinationMarker.setVisible(false);
      } else {
        vx = dx / distance;
        vy = dy / distance;
      }
    }

    this.player.move(vx, vy);
    this.monster.update(this.time.now);
    this.player.sprite.setDepth(this.player.sprite.y + 20);
    this.monster.sprite.setDepth(this.monster.sprite.y + 20);
    for (const object of this.worldObjects) object.setDepth(object.y);
  }

  shutdown() {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.off('pointerupoutside', this.onPointerUp, this);
    this.pointers.clear();
    this.destination = null;
    this.worldObjects.length = 0;
  }
}
