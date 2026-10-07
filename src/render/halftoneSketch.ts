import p5 from 'p5';
import { buildHalftoneScene } from '../effects/halftone';
import {
  COLOR_PRESETS,
  paletteFromColors,
  paletteFromPreset,
} from '../effects/halftone/presets';
import type { Scene } from '../effects/types';
import { perceptualTone } from '../lib/color';
import type { ImageSource } from '../lib/imageAnalysis';
import { gridSize, readPixels } from '../p5/pixels';
import { drawSceneWithP5 } from './drawScene';

export interface HalftoneSettings {
  spacing: number;
  paletteId: string;
  customDot: string;
  customOverlay: string;
  width: number;
  height: number;
  /** Called whenever the scene is rebuilt, so the panel can offer an export. */
  onScene: (scene: Scene | null) => void;
  /** The picture's own dimensions, once p5 has read them. */
  onPicture: (size: { width: number; height: number } | null) => void;
  onError: (message: string) => void;
}

export interface HalftoneSketchHandle {
  loadPicture: (file: File) => void;
  /** True while a chosen file is still being decoded. */
  isDecoding: () => boolean;

  /** Renders the current scene into an offscreen buffer and returns its canvas. */
  renderForExport: (scale: number) => HTMLCanvasElement;
  remove: () => void;
}

const INSET = 24;
const ANALYSIS_EDGE = 1024;

function fit(width: number, height: number, sourceWidth: number, sourceHeight: number) {
  const scale = Math.min(
    Math.max(1, width - INSET * 2) / sourceWidth,
    Math.max(1, height - INSET * 2) / sourceHeight,
  );
  const w = sourceWidth * scale;
  const h = sourceHeight * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

export function createHalftoneSketch(readSettings: () => HalftoneSettings) {
  let instance: p5 | null = null;
  let scene: Scene | null = null;
  let source: ImageSource | null = null;
  let scratch: p5.Graphics | null = null;
  let wanted: File | null = null;
  let decoding = false;

  function palette() {
    const settings = readSettings();
    const preset = COLOR_PRESETS.find((candidate) => candidate.id === settings.paletteId);
    if (preset !== undefined) return paletteFromPreset(preset);
    return paletteFromColors(settings.customDot, settings.customOverlay);
  }

  /** The canvas size is part of the scene, so a resize rebuilds as well. */
  function rebuild(p: p5) {
    if (source === null) return;
    const settings = readSettings();
    const colours = palette();
    scene = buildHalftoneScene({
      source,
      placement: fit(p.width, p.height, source.sourceWidth, source.sourceHeight),
      frame: { width: p.width, height: p.height },
      spacing: settings.spacing,
      resampleBlur: settings.spacing,
      dot: colours.dot,
      overlay: colours.overlay,
    });
    settings.onScene(scene);
  }

  function openPicture(p: p5, file: File) {
    decoding = true;
    const url = URL.createObjectURL(file);
    p.loadImage(
      url,
      (image) => {
        URL.revokeObjectURL(url);
        decoding = false;
        wanted = null;
        source = readTones(p, image, file);
        readSettings().onPicture({ width: image.width, height: image.height });
        rebuild(p);
        p.redraw();
      },
      () => {
        URL.revokeObjectURL(url);
        decoding = false;
        wanted = null;
        readSettings().onError('That image could not be read.');
      },
    );
  }

  function readTones(p: p5, image: p5.Image, file: File): ImageSource {
    const { grid, step } = gridSize(image, ANALYSIS_EDGE);
    const { data, scratch: buffer } = readPixels(p, image, grid, scratch);
    scratch = buffer;
    const luminance = new Float32Array(grid.width * grid.height);
    for (let i = 0, at = 0; i < luminance.length; i += 1, at += 4) {
      luminance[i] = perceptualTone(data[at], data[at + 1], data[at + 2]);
    }

    return {
      luminance,
      gridWidth: grid.width,
      gridHeight: grid.height,
      sourceWidth: image.width,
      sourceHeight: image.height,
      pixelStep: step,
      name: file.name.replace(/\.[^.]+$/, '') || 'image',
    };
  }

  const definition = {
    readSize: () => {
      const settings = readSettings();
      return { width: settings.width, height: settings.height };
    },

    loop: false,

    setup: (p: p5) => {
      p.createCanvas(1, 1);

      return () => {
        if (wanted !== null) openPicture(p, wanted);
        if (source !== null) rebuild(p);

        if (scene === null) {
          p.background(12, 12, 14);
          return;
        }
        drawSceneWithP5(p, scene);
      };
    },

    onReady: (p: p5) => {
      instance = p;
    },

    description: 'A photograph printed as a grid of dots over a solid colour.',
  };

  const handle: HalftoneSketchHandle = {
    isDecoding: () => decoding,

    loadPicture: (file) => {
      wanted = file;
      if (instance === null) return;
      openPicture(instance, file);
    },

    renderForExport: (scale) => {
      if (scene === null || instance === null) {
        throw new Error('There is nothing to export yet.');
      }
      const buffer = instance.createGraphics(
        Math.max(1, Math.round(scene.width)),
        Math.max(1, Math.round(scene.height)),
      );
      buffer.pixelDensity(scale);
      drawSceneWithP5(buffer, scene);
      return (buffer as unknown as { canvas: HTMLCanvasElement }).canvas;
    },

    remove: () => {
      scratch?.remove();
      scratch = null;
      scene = null;
      source = null;
      instance = null;
      readSettings().onPicture(null);
    },
  };
  return { definition, handle };
}
