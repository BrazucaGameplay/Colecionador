/** Returns the display scale used while a character action animation is active. */
export function getActionDisplayScale(baseScale, multiplier = 1.35) {
  const base = Number(baseScale);
  const factor = Number(multiplier);
  if (!Number.isFinite(base) || base < 0 || !Number.isFinite(factor) || factor < 0) return 0;
  return base * factor;
}
