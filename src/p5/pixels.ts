import type p5 from 'p5';

export interface Grid {
  width: number;
  height: number;
}

/** Grid dimensions for an image whose longest edge is capped at `longestEdge`. */
export function gridSize(
  image: { width: number; height: number },
  longestEdge: number,
): { grid: Grid; step: number } {
  const longest = Math.max(image.width, image.height);
  const step = Math.max(1, Math.round(longest / longestEdge));
  return {
    grid: {
      width: Math.max(1, Math.round(image.width / step)),
      height: Math.max(1, Math.round(image.height / step)),
    },
    step,
  };
}

/**
 * Draws an image into an offscreen buffer at grid resolution and hands back its
 * pixels. The buffer is reused between calls, so do not hold on to `data`.
 */
export function readPixels(
  p: p5,
  image: p5.Image,
  grid: Grid,
  scratch: p5.Graphics | null,
): { data: Uint8ClampedArray; scratch: p5.Graphics } {
  const buffer =
    scratch !== null && scratch.width === grid.width && scratch.height === grid.height
      ? scratch
      : p.createGraphics(grid.width, grid.height);
  buffer.pixelDensity(1);
  buffer.clear();
  buffer.image(image, 0, 0, grid.width, grid.height);
  buffer.loadPixels();
  return { data: buffer.pixels as unknown as Uint8ClampedArray, scratch: buffer };
}
