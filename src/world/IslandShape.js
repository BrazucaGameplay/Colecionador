/** Deterministic circular-core island with an irregular outer coastline. */
export const ISLAND_SHAPE = Object.freeze({ centerX: 2048, centerY: 2048, coreRadius: 1660, baseRadius: 1992, inset: 28 });
export function getIslandBoundaryRadius(angle) {
  return ISLAND_SHAPE.baseRadius;
}
export function isInsideIsland(x, y, inset = ISLAND_SHAPE.inset) {
  const dx = x - ISLAND_SHAPE.centerX, dy = y - ISLAND_SHAPE.centerY, distance = Math.hypot(dx, dy);
  if (distance <= ISLAND_SHAPE.coreRadius) return true;
  return distance <= getIslandBoundaryRadius(Math.atan2(dy, dx)) - inset;
}
