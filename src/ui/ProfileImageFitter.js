/**
 * Fits transparent or opaque profile art into a responsive frame.
 * Uses the image's intrinsic dimensions and visible alpha bounds rather
 * than assuming a fixed portrait aspect ratio or fixed CSS offsets.
 */
export function calculateContainLayout(imageWidth, imageHeight, bounds, frameWidth, frameHeight) {
  if (![imageWidth, imageHeight, frameWidth, frameHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const visibleWidth = Math.max(1, bounds.right - bounds.left);
  const visibleHeight = Math.max(1, bounds.bottom - bounds.top);
  const scale = Math.min(frameWidth / visibleWidth, frameHeight / visibleHeight) * 0.96;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    left: (frameWidth - visibleWidth * scale) / 2 - bounds.left * scale,
    top: (frameHeight - visibleHeight * scale) / 2 - bounds.top * scale
  };
}

function detectVisibleBounds(image) {
  const sampleSize = 384;
  const ratio = Math.min(1, sampleSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { left: 0, top: 0, right: image.naturalWidth, bottom: image.naturalHeight };
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] <= 8) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < left || bottom < top) return { left: 0, top: 0, right: image.naturalWidth, bottom: image.naturalHeight };
  return {
    left: left / ratio,
    top: top / ratio,
    right: (right + 1) / ratio,
    bottom: (bottom + 1) / ratio
  };
}

export default class ProfileImageFitter {
  constructor(frame, image) {
    this.frame = frame;
    this.image = image;
    this.bounds = null;
    this.resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => this.update())
      : null;
    this.onWindowResize = () => this.update();
    this.resizeObserver?.observe(frame);
    if (!this.resizeObserver) window.addEventListener('resize', this.onWindowResize);
    this.onLoad = () => {
      try {
        this.bounds = detectVisibleBounds(this.image);
      } catch {
        this.bounds = { left: 0, top: 0, right: this.image.naturalWidth, bottom: this.image.naturalHeight };
      }
      this.update();
    };
    image.addEventListener('load', this.onLoad);
    if (image.complete && image.naturalWidth > 0) this.onLoad();
  }

  update() {
    if (!this.frame || !this.image || !this.image.naturalWidth || !this.bounds) return;
    const layout = calculateContainLayout(
      this.image.naturalWidth,
      this.image.naturalHeight,
      this.bounds,
      this.frame.clientWidth,
      this.frame.clientHeight
    );
    if (!layout) return;
    Object.assign(this.image.style, {
      width: layout.width + 'px',
      height: layout.height + 'px',
      left: layout.left + 'px',
      top: layout.top + 'px'
    });
  }

  destroy() {
    this.resizeObserver?.disconnect();
    if (!this.resizeObserver) window.removeEventListener('resize', this.onWindowResize);
    this.image?.removeEventListener('load', this.onLoad);
    this.frame = null;
    this.image = null;
  }
}
