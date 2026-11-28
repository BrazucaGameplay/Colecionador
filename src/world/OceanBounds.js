import { ISLAND_SHAPE } from './IslandShape.js';

const OCEAN_MARGIN = 256;
const OCEAN_RADIUS = ISLAND_SHAPE.baseRadius + OCEAN_MARGIN;
const OCEAN_PAN_BUFFER_FACTOR = 1.15;
const MIN_CAMERA_ZOOM = 0.2;

/** Returns centered ocean bounds that preserve the coast margin and viewport pan buffer. */
export function calculateOceanBounds(viewWidth, viewHeight) {
  const widthInView = Math.max(1, Number(viewWidth) || 1);
  const heightInView = Math.max(1, Number(viewHeight) || 1);
  const baseDiameter = OCEAN_RADIUS * 2;
  const aspect = Math.max(0.1, widthInView / heightInView);
  const width = Math.max(
    (aspect >= 1 ? baseDiameter * aspect : baseDiameter) * OCEAN_PAN_BUFFER_FACTOR,
    widthInView / MIN_CAMERA_ZOOM * OCEAN_PAN_BUFFER_FACTOR
  );
  const height = Math.max(
    (aspect >= 1 ? baseDiameter : baseDiameter / aspect) * OCEAN_PAN_BUFFER_FACTOR,
    heightInView / MIN_CAMERA_ZOOM * OCEAN_PAN_BUFFER_FACTOR
  );
  return Object.freeze({
    x: ISLAND_SHAPE.centerX - width / 2,
    y: ISLAND_SHAPE.centerY - height / 2,
    width,
    height
  });
}
