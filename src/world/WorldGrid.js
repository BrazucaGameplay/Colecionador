function isPoint(point) {
  return point !== null
    && typeof point === 'object'
    && Number.isInteger(point.x)
    && Number.isInteger(point.y);
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  push(value) {
    this.items.push(value);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].priority <= value.priority) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = value;
  }

  pop() {
    if (this.items.length === 0) return null;
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
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
    }
    return first;
  }

  get size() {
    return this.items.length;
  }
}

export default class WorldGrid {
  #blocked;

  constructor({ width, height, blocked = [] } = {}) {
    if (!Number.isSafeInteger(width) || width < 1
      || !Number.isSafeInteger(height) || height < 1) {
      throw new TypeError('World dimensions must be positive integers.');
    }

    this.width = width;
    this.height = height;
    this.#blocked = new Uint8Array(width * height);

    for (const point of blocked) {
      if (!isPoint(point) || !this.isInside(point)) {
        throw new TypeError('Blocked tiles must be valid coordinates inside the world.');
      }
      this.#blocked[this.toIndex(point)] = 1;
    }
  }

  isInside(point) {
    return isPoint(point)
      && point.x >= 0 && point.x < this.width
      && point.y >= 0 && point.y < this.height;
  }

  toIndex(point) {
    return point.y * this.width + point.x;
  }

  isWalkable(tx, ty) {
    const point = { x: tx, y: ty };
    return this.isInside(point) && this.#blocked[this.toIndex(point)] === 0;
  }

  findPath(start, goal) {
    if (!this.isWalkable(start?.x, start?.y)
      || !this.isWalkable(goal?.x, goal?.y)) return [];

    if (start.x === goal.x && start.y === goal.y) {
      return [{ x: start.x, y: start.y }];
    }

    const directions = [
      { x: 0, y: -1, cost: 1 },
      { x: 1, y: 0, cost: 1 },
      { x: 0, y: 1, cost: 1 },
      { x: -1, y: 0, cost: 1 },
      { x: 1, y: -1, cost: Math.SQRT2 },
      { x: 1, y: 1, cost: Math.SQRT2 },
      { x: -1, y: 1, cost: Math.SQRT2 },
      { x: -1, y: -1, cost: Math.SQRT2 }
    ];

    const startIndex = this.toIndex(start);
    const goalIndex = this.toIndex(goal);
    const total = this.width * this.height;
    const costs = new Float64Array(total);
    costs.fill(Infinity);
    const previous = new Int32Array(total);
    previous.fill(-1);
    const closed = new Uint8Array(total);
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

      for (const direction of directions) {
        const next = { x: x + direction.x, y: y + direction.y };
        if (!this.isWalkable(next.x, next.y)) continue;

        const diagonal = direction.x !== 0 && direction.y !== 0;
        if (diagonal && (
          !this.isWalkable(x + direction.x, y)
          || !this.isWalkable(x, y + direction.y)
        )) continue;

        const nextIndex = this.toIndex(next);
        if (closed[nextIndex]) continue;

        const nextCost = costs[current.index] + direction.cost;
        if (nextCost >= costs[nextIndex]) continue;

        costs[nextIndex] = nextCost;
        previous[nextIndex] = current.index;
        open.push({
          index: nextIndex,
          priority: nextCost + heuristic(next.x, next.y)
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
