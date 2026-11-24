function isTile(point) {
  return point !== null && typeof point === 'object'
    && Number.isInteger(point.x) && Number.isInteger(point.y);
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  push(node) {
    let index = this.items.length;
    this.items.push(node);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].priority <= node.priority) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = node;
  }

  pop() {
    if (this.items.length === 0) return null;
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.items.length) break;
      const child = right < this.items.length
        && this.items[right].priority < this.items[left].priority
        ? right
        : left;
      if (this.items[child].priority >= last.priority) break;
      this.items[index] = this.items[child];
      index = child;
    }
    this.items[index] = last;
    return first;
  }

  get size() {
    return this.items.length;
  }
}

const DIRECTIONS = [
  { x: 0, y: -1, cost: 1 },
  { x: 1, y: 0, cost: 1 },
  { x: 0, y: 1, cost: 1 },
  { x: -1, y: 0, cost: 1 },
  { x: 1, y: -1, cost: Math.SQRT2 },
  { x: 1, y: 1, cost: Math.SQRT2 },
  { x: -1, y: 1, cost: Math.SQRT2 },
  { x: -1, y: -1, cost: Math.SQRT2 }
];

export default class WorldCore {
  #blocked;
  #playerBodyTile;

  constructor({ width, height, blockedTiles = [], playerBodyTile = { x: 0, y: 0 } } = {}) {
    if (!Number.isSafeInteger(width) || width < 1
      || !Number.isSafeInteger(height) || height < 1) {
      throw new TypeError('World dimensions must be positive integers.');
    }
    if (!isTile(playerBodyTile)) {
      throw new TypeError('Player body tile must contain integer x and y coordinates.');
    }

    this.width = width;
    this.height = height;
    this.#blocked = new Uint8Array(width * height);
    this.#playerBodyTile = { ...playerBodyTile };

    for (const tile of blockedTiles) {
      if (!isTile(tile) || !this.isInside(tile.x, tile.y)) {
        throw new RangeError('Blocked tile is outside the world bounds.');
      }
      this.#blocked[this.toIndex(tile.x, tile.y)] = 1;
    }

    if (!this.isWalkable(playerBodyTile.x, playerBodyTile.y)) {
      throw new RangeError('Player body tile must be walkable.');
    }
  }

  toIndex(tx, ty) {
    return ty * this.width + tx;
  }

  isInside(tx, ty) {
    return Number.isInteger(tx) && Number.isInteger(ty)
      && tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  isWalkable(tx, ty) {
    return this.isInside(tx, ty) && this.#blocked[this.toIndex(tx, ty)] === 0;
  }

  getPlayerBodyTile() {
    return { ...this.#playerBodyTile };
  }

  setPlayerBodyTile(tile) {
    if (!isTile(tile) || !this.isWalkable(tile.x, tile.y)) return false;
    this.#playerBodyTile = { ...tile };
    return true;
  }

  findPath(start, goal) {
    if (!isTile(start) || !isTile(goal)
      || !this.isWalkable(start.x, start.y)
      || !this.isWalkable(goal.x, goal.y)) return [];

    if (start.x === goal.x && start.y === goal.y) return [{ ...start }];

    const startIndex = this.toIndex(start.x, start.y);
    const goalIndex = this.toIndex(goal.x, goal.y);
    const size = this.width * this.height;
    const costs = new Float64Array(size);
    costs.fill(Infinity);
    const previous = new Int32Array(size);
    previous.fill(-1);
    const closed = new Uint8Array(size);
    const open = new MinHeap();

    const heuristic = (x, y) => {
      const dx = Math.abs(goal.x - x);
      const dy = Math.abs(goal.y - y);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };

    costs[startIndex] = 0;
    open.push({ index: startIndex, priority: heuristic(start.x, start.y) });

    while (open.size > 0) {
      const current = open.pop();
      if (closed[current.index]) continue;
      if (current.index === goalIndex) break;
      closed[current.index] = 1;

      const x = current.index % this.width;
      const y = Math.floor(current.index / this.width);

      for (const direction of DIRECTIONS) {
        const nextX = x + direction.x;
        const nextY = y + direction.y;
        if (!this.isWalkable(nextX, nextY)) continue;

        const diagonal = direction.x !== 0 && direction.y !== 0;
        if (diagonal && (
          !this.isWalkable(x + direction.x, y)
          || !this.isWalkable(x, y + direction.y)
        )) continue;

        const nextIndex = this.toIndex(nextX, nextY);
        if (closed[nextIndex]) continue;

        const nextCost = costs[current.index] + direction.cost;
        if (nextCost >= costs[nextIndex]) continue;

        costs[nextIndex] = nextCost;
        previous[nextIndex] = current.index;
        open.push({
          index: nextIndex,
          priority: nextCost + heuristic(nextX, nextY)
        });
      }
    }

    if (previous[goalIndex] === -1) return [];

    const path = [];
    let cursor = goalIndex;
    while (cursor !== -1) {
      path.push({
        x: cursor % this.width,
        y: Math.floor(cursor / this.width)
      });
      if (cursor === startIndex) break;
      cursor = previous[cursor];
    }

    path.reverse();
    return path;
  }
}
