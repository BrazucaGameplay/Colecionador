const CELL = 24;
const DIRECTIONS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
];

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
  }

  setAlphaMask(rgbaPixels, width, height, threshold = 150) {
    this.alphaMask = new Uint8Array(width * height);
    this.maskWidth = width;
    this.maskHeight = height;
    for (let i = 0; i < this.alphaMask.length; i++) {
      this.alphaMask[i] = rgbaPixels[i * 4 + 3] >= threshold ? 1 : 0;
    }
  }

  isInsideIsland(x, y) {
    if (!this.alphaMask) return true;
    const px = Math.floor(x * this.maskWidth / this.width);
    const py = Math.floor(y * this.maskHeight / this.height);
    if (px < 0 || py < 0 || px >= this.maskWidth || py >= this.maskHeight) return false;
    return this.alphaMask[py * this.maskWidth + px] === 1;
  }

  addObstacle(x, y, radiusX, radiusY = radiusX) {
    this.blockers.push({ x, y, radiusX, radiusY });
  }

  isWalkable(col, row) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return false;
    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2;
    if (!this.isInsideIsland(x, y)) return false;
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
    const key = (c, r) => c + ',' + r;
    const startKey = key(start.col, start.row);
    const endKey = key(end.col, end.row);
    if (startKey === endKey) {
      return [{ x: end.col * CELL + CELL / 2, y: end.row * CELL + CELL / 2 }];
    }
    const open = [{ ...start, g: 0, f: Math.hypot(end.col - start.col, end.row - start.row) }];
    const cameFrom = new Map();
    const costs = new Map([[startKey, 0]]);
    const closed = new Set();
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      const currentKey = key(current.col, current.row);
      if (closed.has(currentKey)) continue;
      if (currentKey === endKey) {
        const path = [];
        let cursor = endKey;
        while (cursor !== startKey) {
          const [col, row] = cursor.split(',').map(Number);
          path.unshift({ x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 });
          cursor = cameFrom.get(cursor);
          if (!cursor) return [];
        }
        return path;
      }
      closed.add(currentKey);
      for (const [dx, dy, weight] of DIRECTIONS) {
        const col = current.col + dx;
        const row = current.row + dy;
        if (!this.isWalkable(col, row)) continue;
        if (dx && dy && (!this.isWalkable(current.col + dx, current.row) || !this.isWalkable(current.col, current.row + dy))) continue;
        const nextKey = key(col, row);
        const cost = current.g + weight;
        if (cost >= (costs.get(nextKey) ?? Infinity)) continue;
        costs.set(nextKey, cost);
        cameFrom.set(nextKey, currentKey);
        open.push({ col, row, g: cost, f: cost + Math.hypot(end.col - col, end.row - row) });
      }
    }
    return [];
  }
}
