import { getIslandBoundaryRadius, ISLAND_SHAPE } from './IslandShape.js';
const CELL = 24;
const DIRECTIONS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
];
const MAX_SEARCH_NODES = 12000;

class MinHeap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= item.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const first = a[0];
    const last = a.pop();
    if (a.length) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= a.length) break;
        if (child + 1 < a.length && a[child + 1].f < a[child].f) child++;
        if (a[child].f >= last.f) break;
        a[i] = a[child];
        i = child;
      }
      a[i] = last;
    }
    return first;
  }
}

export default class WorldNavigation {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / CELL);
    this.rows = Math.ceil(height / CELL);
    this.blockers = [];
    this.alphaMask = null;
    this.maskWidth = 0;
    this.maskHeight = 0;
    this.walkableGrid = null;
    this.circleMask = null;
    this.shapeMask = null;
  }

  setCircleMask(centerX, centerY, radius) {
    this.shapeMask = null;
    this.alphaMask = null;
    this.circleMask = { centerX, centerY, radius };
    this.maskWidth = 0;
    this.maskHeight = 0;
    this.walkableGrid = new Uint8Array(this.cols * this.rows);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * CELL + CELL / 2;
        const y = row * CELL + CELL / 2;
        this.walkableGrid[row * this.cols + col] = this.isInsideIsland(x, y) ? 1 : 0;
      }
    }
  }

  setIslandMask(centerX, centerY, shape = ISLAND_SHAPE) {
    this.alphaMask = null; this.circleMask = null;
    this.shapeMask = { centerX, centerY, coreRadius: shape.coreRadius, inset: shape.inset };
    this.walkableGrid = new Uint8Array(this.cols * this.rows);
    for (let row=0; row<this.rows; row++) for (let col=0; col<this.cols; col++) {
      const x=col*CELL+CELL/2, y=row*CELL+CELL/2;
      this.walkableGrid[row*this.cols+col] = this.isInsideIsland(x,y) ? 1 : 0;
    }
  }

  setAlphaMask(rgbaPixels, width, height, threshold = 150) {
    this.shapeMask = null;
    this.alphaMask = new Uint8Array(width * height);
    this.maskWidth = width;
    this.maskHeight = height;
    for (let i = 0; i < this.alphaMask.length; i++) {
      this.alphaMask[i] = rgbaPixels[i * 4 + 3] >= threshold ? 1 : 0;
    }

    // Precompute the navigation grid once during scene creation. Previously,
    // every A* expansion sampled the full-resolution alpha mask repeatedly.
    this.walkableGrid = new Uint8Array(this.cols * this.rows);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * CELL + CELL / 2;
        const y = row * CELL + CELL / 2;
        this.walkableGrid[row * this.cols + col] = this.isInsideIsland(x, y) ? 1 : 0;
      }
    }
  }

  isInsideIsland(x, y) {
    if (this.shapeMask) {
      const dx=x-this.shapeMask.centerX, dy=y-this.shapeMask.centerY, distance=Math.hypot(dx,dy);
      if(distance<=this.shapeMask.coreRadius)return true;
      return distance<=getIslandBoundaryRadius(Math.atan2(dy,dx))-this.shapeMask.inset;
    }
    if (this.circleMask) {
      const dx = x - this.circleMask.centerX;
      const dy = y - this.circleMask.centerY;
      return dx * dx + dy * dy <= this.circleMask.radius * this.circleMask.radius;
    }
    if (!this.alphaMask) return true;
    const inset = 14;
    const offsets = [
      [0, 0], [inset, 0], [-inset, 0], [0, inset], [0, -inset],
      [inset * 0.7, inset * 0.7], [-inset * 0.7, inset * 0.7],
      [inset * 0.7, -inset * 0.7], [-inset * 0.7, -inset * 0.7]
    ];
    return offsets.every(([dx, dy]) => {
      const px = Math.floor((x + dx) * this.maskWidth / this.width);
      const py = Math.floor((y + dy) * this.maskHeight / this.height);
      return px >= 0 && py >= 0 && px < this.maskWidth && py < this.maskHeight &&
        this.alphaMask[py * this.maskWidth + px] === 1;
    });
  }

  findNearestWalkablePoint(x, y, radius = 10) {
    const originCol = Math.floor(x / CELL);
    const originRow = Math.floor(y / CELL);

    // A célula pode estar dentro da ilha enquanto o espaço ocupado pelo
    // personagem cruza a borda. Validamos a área real antes de aceitar o spawn.
    for (let ring = 0; ring < 40; ring++) {
      for (let rowOffset = -ring; rowOffset <= ring; rowOffset++) {
        for (let colOffset = -ring; colOffset <= ring; colOffset++) {
          if (ring > 0 && Math.max(Math.abs(colOffset), Math.abs(rowOffset)) !== ring) continue;
          const col = originCol + colOffset;
          const row = originRow + rowOffset;
          if (!this.isWalkable(col, row)) continue;

          const point = {
            x: col * CELL + CELL / 2,
            y: row * CELL + CELL / 2
          };
          if (this.isAreaWalkable(point.x, point.y, radius)) return point;
        }
      }
    }
    return null;
  }

  addObstacle(x, y, radiusX, radiusY = radiusX) {
    this.blockers.push({ x, y, radiusX, radiusY });
  }

  isWalkable(col, row) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false;
    const index = row * this.cols + col;
    if (this.walkableGrid && this.walkableGrid[index] !== 1) return false;
    if (!this.walkableGrid && !this.isInsideIsland(col * CELL + CELL / 2, row * CELL + CELL / 2)) return false;
    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2;
    return !this.blockers.some(b => {
      const dx = (x - b.x) / (b.radiusX + 12);
      const dy = (y - b.y) / (b.radiusY + 12);
      return dx * dx + dy * dy < 1;
    });
  }

  isAreaWalkable(x, y, radius = 10) {
    if (x - radius < 0 || y - radius < 0 || x + radius > this.width || y + radius > this.height) return false;
    const samples = [
      [0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius],
      [radius * 0.7, radius * 0.7], [-radius * 0.7, radius * 0.7],
      [radius * 0.7, -radius * 0.7], [-radius * 0.7, -radius * 0.7]
    ];
    if (samples.some(([dx, dy]) => !this.isInsideIsland(x + dx, y + dy))) return false;
    return !this.blockers.some(b => {
      const dx = (x - b.x) / (b.radiusX + radius);
      const dy = (y - b.y) / (b.radiusY + radius);
      return dx * dx + dy * dy < 1;
    });
  }

  nearestWalkable(col, row) {
    if (this.isWalkable(col, row)) return { col, row };
    for (let radius = 1; radius < 20; radius++) {
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== radius) continue;
          if (this.isWalkable(col + x, row + y)) return { col: col + x, row: row + y };
        }
      }
    }
    return null;
  }

  findPath(startX, startY, endX, endY) {
    const start = this.nearestWalkable(Math.floor(startX / CELL), Math.floor(startY / CELL));
    const end = this.nearestWalkable(Math.floor(endX / CELL), Math.floor(endY / CELL));
    if (!start || !end) return [];
    const key = (col, row) => row * this.cols + col;
    const startKey = key(start.col, start.row);
    const endKey = key(end.col, end.row);
    if (startKey === endKey) {
      return [{ x: end.col * CELL + CELL / 2, y: end.row * CELL + CELL / 2 }];
    }

    // Binary heap avoids sorting the entire open list on every search step.
    const open = new MinHeap();
    const cameFrom = new Map();
    const costs = new Map([[startKey, 0]]);
    const closed = new Set();
    open.push({ ...start, key: startKey, g: 0, f: Math.hypot(end.col - start.col, end.row - start.row) });
    let visited = 0;

    while (open.size && visited < MAX_SEARCH_NODES) {
      const current = open.pop();
      if (closed.has(current.key)) continue;
      if (current.key === endKey) {
        const path = [];
        let cursor = endKey;
        while (cursor !== startKey) {
          const row = Math.floor(cursor / this.cols);
          const col = cursor - row * this.cols;
          path.unshift({ x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 });
          cursor = cameFrom.get(cursor);
          if (cursor === undefined) return [];
        }
        return path;
      }
      closed.add(current.key);
      visited++;

      for (const [dx, dy, weight] of DIRECTIONS) {
        const col = current.col + dx;
        const row = current.row + dy;
        if (!this.isWalkable(col, row)) continue;
        if (dx && dy && (!this.isWalkable(current.col + dx, current.row) || !this.isWalkable(current.col, current.row + dy))) continue;
        const nextKey = key(col, row);
        if (closed.has(nextKey)) continue;
        const cost = current.g + weight;
        if (cost >= (costs.get(nextKey) ?? Infinity)) continue;
        costs.set(nextKey, cost);
        cameFrom.set(nextKey, current.key);
        open.push({ col, row, key: nextKey, g: cost, f: cost + Math.hypot(end.col - col, end.row - row) });
      }
    }
    return [];
  }
}
