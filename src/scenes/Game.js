import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import { SAVE_KEY } from '../config.js';

const CAMERA_ZOOM = Object.freeze({ min: 0.65, max: 2.25, initial: 1 });
const TAP_MOVE_THRESHOLD = 12;

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
    this.pointers = new Map();
    this.destination = null;
    this.gesture = null;
  }

  create() {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 30; x++) {
        if ((x + y) % 7 === 0) {
          this.add.image(x * 32 + 16, y * 32 + 16, 'tile').setAlpha(0.25);
        }
      }
    }

    this.player = new Player(this, 480, 270);
    this.monster = new Monster(this, 200, 150);
    this.physics.add.overlap(this.player.sprite, this.monster.sprite, () => this.hitMonster());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.hp = 3;
    this.hpText = this.add.text(16, 16, 'HP ' + this.hp, {
      fontSize: '20px',
      color: '#fff'
    }).setScrollFactor(0).setDepth(1000);

    this.score = 0;
    this.scoreText = this.add.text(16, 44, 'Monstros: ' + this.score, {
      fontSize: '18px',
      color: '#fff'
    }).setScrollFactor(0).setDepth(1000);

    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, 960, 544);
    this.camera.setZoom(CAMERA_ZOOM.initial);

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
        const ratio = distance / this.gesture.startDistance;
        const zoom = Phaser.Math.Clamp(
          this.gesture.startZoom * ratio,
          CAMERA_ZOOM.min,
          CAMERA_ZOOM.max
        );
        this.camera.setZoom(zoom);
      }
      return;
    }

    if (this.gesture?.pointerId !== pointer.id) return;
    if (point.moved) {
      this.gesture.type = 'pan';
      const dx = pointer.x - this.gesture.lastX;
      const dy = pointer.y - this.gesture.lastY;
      this.camera.scrollX -= dx / this.camera.zoom;
      this.camera.scrollY -= dy / this.camera.zoom;
      this.gesture.lastX = pointer.x;
      this.gesture.lastY = pointer.y;
    }
  }

  onPointerUp(pointer) {
    const point = this.pointers.get(pointer.id);
    if (!point) return;

    const wasTap = this.pointers.size === 1 && !point.moved
      && this.gesture?.type === 'pending';
    if (wasTap) {
      const destination = this.camera.getWorldPoint(pointer.x, pointer.y);
      this.setDestination(destination.x, destination.y);
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

  setDestination(x, y) {
    const worldPoint = this.physics.world.bounds;
    const targetX = Phaser.Math.Clamp(x, worldPoint.x, worldPoint.right);
    const targetY = Phaser.Math.Clamp(y, worldPoint.y, worldPoint.bottom);
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
  }

  shutdown() {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.input.off('pointerupoutside', this.onPointerUp, this);
    this.pointers.clear();
    this.destination = null;
  }
}
