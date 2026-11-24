import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Monster from '../entities/Monster.js';
import WorldNavigation from '../world/WorldNavigation.js';
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
    this.groundTiles = [];
    this.route = [];
  }

  create() {
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    this.worldWidth = Math.max(1280, Math.ceil((viewWidth * 2) / TILE_WIDTH) * TILE_WIDTH);
    this.worldHeight = Math.max(960, Math.ceil((viewHeight * 2) / TILE_HEIGHT) * TILE_HEIGHT);
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.navigation = new WorldNavigation(this.worldWidth, this.worldHeight);
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
    if (!this.textures.exists('world-grass')) {
      console.error('Textura world-grass ausente; confira o carregamento em Preload.');
      return;
    }

    // Malha isométrica: losangos 128x64, com passo vertical de 32px
    // e deslocamento alternado de 64px. A textura escolhida por célula
    // compõe o chão sem faixas sobrepostas ou peças espaçadas.
    const rowStep = TILE_HEIGHT / 2;
    const rows = Math.ceil(this.worldHeight / rowStep) + 3;
    const columns = Math.ceil(this.worldWidth / TILE_WIDTH) + 3;
    const roadRow = Math.floor((this.worldHeight / 2 + 160) / rowStep);
    const waterCenterRow = Math.floor((this.worldHeight / 2 - 210) / rowStep);
    const waterCenterColumn = Math.floor((this.worldWidth / 2 + 310) / TILE_WIDTH);

    this.terrainCells = new Map();
    for (let row = -1; row < rows; row++) {
      for (let column = -1; column < columns; column++) {
        const x = column * TILE_WIDTH + ((row & 1) ? TILE_WIDTH / 2 : 0);
        const y = row * rowStep;
        const roadCurve = Math.round((row - roadRow) * 0.20);
        const onRoad = Math.abs(column - Math.floor(columns / 2) - roadCurve) <= 1;
        const waterDx = column - waterCenterColumn;
        const waterDy = row - waterCenterRow;
        const inPond = (waterDx * waterDx) / 7 + (waterDy * waterDy) / 19 <= 1;

        let texture = 'world-grass';
        if (onRoad && this.textures.exists('world-path')) texture = 'world-path';
        if (inPond && this.textures.exists('world-water')) texture = 'world-water';

        const tile = this.add.image(x, y, texture)
          .setDisplaySize(TILE_WIDTH, TILE_HEIGHT)
          .setOrigin(0.5, 0.5)
          .setDepth(-1000 + y * 0.0001);
        this.groundTiles.push(tile);
        this.terrainCells.set(row + ':' + column, { row, column, x, y, texture });
        if (texture === 'world-water') this.navigation.addObstacle(x, y, 48, 24);
      }
    }

    // A margem de areia acompanha a borda inferior da lagoa e conecta
    // visualmente a água ao gramado sem transformar a margem em obstáculo.
    if (this.textures.exists('world-shore')) {
      const shoreCells = [
        [waterCenterRow + 3, waterCenterColumn - 2],
        [waterCenterRow + 4, waterCenterColumn - 1],
        [waterCenterRow + 4, waterCenterColumn],
        [waterCenterRow + 3, waterCenterColumn + 1]
      ];
      for (const [row, column] of shoreCells) {
        const cell = this.terrainCells.get(row + ':' + column);
        if (!cell) continue;
        const shore = this.add.image(cell.x, cell.y, 'world-shore')
          .setDisplaySize(TILE_WIDTH, TILE_HEIGHT)
          .setOrigin(0.5, 0.5)
          .setDepth(-999 + cell.y * 0.0001);
        this.groundTiles.push(shore);
      }
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
      if (key === 'world-tree' || key === 'world-rocks') {
        const baseY = y - width * 0.10;
        this.navigation.addObstacle(x, baseY, width * (key === 'world-tree' ? 0.20 : 0.30), width * 0.13);
      }
      return image;
    };

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
    this.pointers.set(pointer.id, { x: pointer.x, y: pointer.y, startX: pointer.x, startY: pointer.y, moved: false });
    if (this.pointers.size === 1) {
      this.gesture = { type: 'pending', pointerId: pointer.id, lastX: pointer.x, lastY: pointer.y };
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
    this.route = this.navigation.findPath(this.player.sprite.x, this.player.sprite.y, targetX, targetY);
    if (!this.route.length) {
      this.destination = null;
      this.destinationMarker.setVisible(false);
      return;
    }
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

  update(time, delta = 16.67) {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

    if (vx !== 0 || vy !== 0) {
      this.destination = null;
      this.route.length = 0;
      this.destinationMarker.setVisible(false);
    } else if (this.destination && this.route.length) {
      const waypoint = this.route[0];
      const dx = waypoint.x - this.player.sprite.x;
      const dy = waypoint.y - this.player.sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 10) {
        this.route.shift();
        if (!this.route.length) {
          this.destination = null;
          this.destinationMarker.setVisible(false);
        }
      } else {
        vx = dx / distance;
        vy = dy / distance;
      }
    }

    const step = Math.max(0, Math.min(delta, 50)) / 1000;
    const speed = this.player.speed;
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;
    const nextX = playerX + vx * speed * step;
    const nextY = playerY + vy * speed * step;
    if (!this.navigation.isAreaWalkable(nextX, playerY, 10)) vx = 0;
    if (!this.navigation.isAreaWalkable(playerX, nextY, 10)) vy = 0;
    if (vx && vy) {
      const length = Math.hypot(vx, vy);
      vx /= length;
      vy /= length;
    }
    this.player.move(vx, vy);
    this.monster.update(this.time.now);
    const monsterNextX = this.monster.sprite.x + this.monster.sprite.body.velocity.x * step;
    const monsterNextY = this.monster.sprite.y + this.monster.sprite.body.velocity.y * step;
    if (!this.navigation.isAreaWalkable(monsterNextX, monsterNextY, 12)) {
      this.monster.sprite.setVelocity(0, 0);
    }
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
    this.route.length = 0;
    this.worldObjects.length = 0;
    this.groundTiles.length = 0;
  }
}
