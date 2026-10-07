
export interface ImageSource {
  readonly luminance: Float32Array;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly pixelStep: number;
  readonly name: string;
}

export function sampleLuminance(
  source: ImageSource,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const { luminance, gridWidth, gridHeight, pixelStep } = source;
  const left = x0 / pixelStep;
  const right = x1 / pixelStep;
  const top = y0 / pixelStep;
  const bottom = y1 / pixelStep;
  const firstX = Math.max(0, Math.ceil(left - 0.5));
  const lastX = Math.min(gridWidth - 1, Math.floor(right - 0.5));
  const firstY = Math.max(0, Math.ceil(top - 0.5));
  const lastY = Math.min(gridHeight - 1, Math.floor(bottom - 0.5));

  if (lastX < firstX || lastY < firstY) {
    const cx = Math.min(gridWidth - 1, Math.max(0, Math.round((left + right) / 2 - 0.5)));
    const cy = Math.min(gridHeight - 1, Math.max(0, Math.round((top + bottom) / 2 - 0.5)));
    return luminance[cy * gridWidth + cx];
  }

  let weighted = 0;
  let area = 0;
  for (let y = firstY; y <= lastY; y += 1) {
    const overlapY = Math.min(bottom, y + 0.5) - Math.max(top, y - 0.5);
    if (overlapY <= 0) continue;
    for (let x = firstX; x <= lastX; x += 1) {
      const overlapX = Math.min(right, x + 0.5) - Math.max(left, x - 0.5);
      if (overlapX <= 0) continue;
      const weight = overlapX * overlapY;
      weighted += luminance[y * gridWidth + x] * weight;
      area += weight;
    }
  }

  if (area > 0) return weighted / area;
  const cellX = Math.min(gridWidth - 1, Math.max(0, Math.floor((left + right) / 2)));
  const cellY = Math.min(gridHeight - 1, Math.max(0, Math.floor((top + bottom) / 2)));
  return luminance[cellY * gridWidth + cellX];
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function boxPass(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
  horizontal: boolean,
): void {
  const span = horizontal ? width : height;
  const lines = horizontal ? height : width;
  const norm = 1 / (2 * radius + 1);

  for (let line = 0; line < lines; line += 1) {
    const at = (index: number) =>
      horizontal ? line * width + index : index * width + line;
    let sum = 0;
    for (let i = -radius; i <= radius; i += 1) {
      sum += src[at(Math.min(span - 1, Math.max(0, i)))];
    }

    for (let i = 0; i < span; i += 1) {
      dst[at(i)] = sum * norm;
      sum += src[at(Math.min(span - 1, i + radius + 1))];
      sum -= src[at(Math.max(0, i - radius))];
    }
  }
}

export function prefilter(
  luminance: Float32Array,
  width: number,
  height: number,
  sigma: number,
): Float32Array {
  if (sigma < 0.3) return luminance;
  const radius = Math.max(1, Math.round(sigma * Math.sqrt(3)));
  const scratch = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  boxPass(luminance, scratch, width, height, radius, true);
  boxPass(scratch, out, width, height, radius, false);
  return out;
}
