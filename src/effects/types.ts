import type { Rgb } from '../lib/color';
import type { ImageSource } from '../lib/imageAnalysis';

export interface Circle {  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Scene {
  readonly width: number;
  readonly height: number;
  readonly picture: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly background: Rgb;
  readonly dot: Rgb;
  readonly circles: readonly Circle[];
}

export interface SceneInput {
  readonly source: ImageSource;

  readonly placement: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };

  readonly frame: {
    readonly width: number;
    readonly height: number;
  };
  readonly dot: Rgb;
  readonly overlay: Rgb;
  readonly spacing: number;
  readonly resampleBlur: number;
}
