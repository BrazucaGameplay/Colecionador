const DEFAULT_WIDTH = 90;
const DEFAULT_HEIGHT = 120;
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

function tileKey(x, y) {
  return `${x},${y}`;
}

function isTile(value) {
  return value !== null && typeof value === 'object'
    && Number.isInteger(value.x) && Number.isInteger(value.y);
}

function heuristic(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
    + (Math.SQRT2 - 2) * Math.min(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export default class WorldCore {
  #blocked;
  #playerBodyTile;

  constructor({ width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, blockedTiles = [], playerBodyTile = { x: 0, y: 0 } } = {}) {
    if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
      throw new TypeError('World dimensions must be positive integers.');
    }
    if (!isTile(playerBodyTile)) {
      throw new TypeError('Player body tile must contain integer x and y coordinates.');
    }

    this.width = width;
    this.height = height;
    this.#blocked = new Set();
    this.#playerBodyTile = { ...playerBodyTile };

    for (const tile of blockedTiles) {
      if (!isTile(tile) || !this.isInside(tile.x, tile.y)) {
        throw new RangeError('Blocked tile is outside the world bounds.');
      }
      this.#blocked.add(tileKey(tile.x, tile.y));
    }

    if (!this.isWalkable(playerBodyTile.x, playerBodyTile.y)) {
      throw new RangeError('Player body tile must be walkable.');
    }
  }

  isInside(tx, ty) {
    return Number.isInteger(tx) && Number.isInteger(ty)
      && tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  isWalkable(tx, ty) {
    return this.isInside(tx, ty) && !this.#blocked.has(tileKey(tx, ty));
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
    if (!isTile(start) || !isTile(goal) || !this.isWalkable(start.x, start.y)
      || !this.isWalkable(goal.x, goal.y)) return [];

    if (start.x === goal.x && start.y === goal.y) return [{ ...start }];

    const startKey = tileKey(start.x, start.y);
    const goalKey = tileKey(goal.x, goal.y);
    const open = new Map([[startKey, { ...start, g: 0, f: heuristic(start, goal) }]]);
    const cameFrom = new Map();
    const scores = new Map([[startKey, 0]]);
    const closed = new Set();

    while (open.size > 0) {
      let currentKey;
      let current;
      for (const [key, candidate] of open) {
        if (!current || candidate.f < current.f) {
          current = candidate;
          currentKey = key;
        }
      }

      if (currentKey === goalKey) {
        const path = [{ x: current.x, y: current.y }];
        let key = currentKey;
        while (cameFrom.has(key)) {
          key = cameFrom.get(key);
          const [x, y] = key.split(',').map(Number);
          path.unshift({ x, y });
        }
        return path;
      }

      open.delete(currentKey);
      closed.add(currentKey);

      for (const direction of DIRECTIONS) {
        const next = { x: current.x + direction.x, y: current.y + direction.y };
        const nextKey = tileKey(next.x, next.y);
        if (closed.has(nextKey) || !this.isWalkable(next.x, next.y)) continue;

        if (direction.x !== 0 && direction.y !== 0) {
          if (!this.isWalkable(current.x + direction.x, current.y)
            || !this.isWalkable(current.x, current.y + direction.y)) continue;
        }

        const tentative = scores.get(currentKey) + direction.cost;
        if (tentative >= (scores.get(nextKey) ?? Infinity)) continue;

        cameFrom.set(nextKey, currentKey);
        scores.set(nextKey, tentative);
        open.set(nextKey, { ...next, g: tentative, f: tentative + heuristic(next, goal) });
      }
    }

    return [];
  }
}
