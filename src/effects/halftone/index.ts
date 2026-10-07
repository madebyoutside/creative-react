import { toneOf } from '../../lib/color';
import { prefilter, sampleLuminance, type ImageSource } from '../../lib/imageAnalysis';
import type { Scene, SceneInput } from '../types';

export const REFERENCE_SPACING = 5.5;
const MIN_DRAWN_RADIUS = 0.2;

export function dotRadiusForTone(
  tone: number,
  step: number,
  inkSpan: number,
  groundTone: number,
): number {
  if (inkSpan <= 0) return 0;
  const coverage = Math.min(1, Math.max(0, (groundTone - tone) / inkSpan));
  return step * Math.sqrt(coverage / Math.PI);
}

export const MIN_PITCH = 3;
export const MAX_PITCH = 24;
const MAX_DOTS = 120_000;

function budgetedSpacing(spacing: number, width: number, height: number): number {
  let step = Math.min(MAX_PITCH, Math.max(MIN_PITCH, spacing));
  while (Math.ceil(width / step) * Math.ceil(height / step) > MAX_DOTS) {
    const next = step * 1.15;
    if (next >= MAX_PITCH) return MAX_PITCH;
    step = next;
  }

  return step;
}

function blurForPitch(source: ImageSource, placementWidth: number, resampleBlur: number): ImageSource {
  if (resampleBlur <= 0) return source;
  const samplesPerOutput = placementWidth / source.sourceWidth;
  const sigma = 0.5 * resampleBlur * samplesPerOutput;
  if (sigma < 0.3) return source;

  return {
    ...source,
    luminance: prefilter(source.luminance, source.gridWidth, source.gridHeight, sigma),
  };
}

export function buildHalftoneScene(input: SceneInput): Scene {
  const { placement, frame } = input;
  const width = Math.max(1, Math.round(frame.width));
  const height = Math.max(1, Math.round(frame.height));
  const step = budgetedSpacing(input.spacing, placement.width, placement.height);
  const source = blurForPitch(input.source, placement.width, input.resampleBlur);
  const maxRadius = (step / 2) * Math.SQRT2;
  const columns = Math.max(1, Math.ceil(placement.width / step));
  const rows = Math.max(1, Math.ceil(placement.height / step));
  const analysedPerOutput = source.sourceWidth / placement.width;
  const dotTone = toneOf(input.dot);
  const groundTone = toneOf(input.overlay);
  const inkSpan = groundTone - dotTone;
  const circles: { x: number; y: number; radius: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    const top = row * step;
    for (let column = 0; column < columns; column += 1) {
      const left = column * step;

      const lum = sampleLuminance(
        source,
        left * analysedPerOutput,
        top * analysedPerOutput,
        (left + step) * analysedPerOutput,
        (top + step) * analysedPerOutput,
      );

      const radius = Math.min(
        maxRadius,
        dotRadiusForTone(lum, step, inkSpan, groundTone),
      );
      if (radius < MIN_DRAWN_RADIUS) continue;
      circles.push({
        x: column * step + step / 2 + placement.x,
        y: row * step + step / 2 + placement.y,
        radius,
      });
    }
  }

  return {
    width,
    height,
    picture: {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    },
    background: input.overlay,
    dot: input.dot,
    circles,
  };
}
