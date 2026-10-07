import { hexToRgb, contrastRatio, type Rgb } from '../../lib/color';

export interface Palette {
  readonly dot: Rgb;
  readonly overlay: Rgb;
}

export interface ColorPreset {
  readonly id: string;
  readonly label: string;
  readonly dot: string;
  readonly overlay: string;
}

export const COLOR_PRESETS: readonly ColorPreset[] = [

  { id: 'black-clementine', label: 'Black on clementine', dot: '#0B0B0B', overlay: '#EA917C' },
  { id: 'cocoa-cream', label: 'Cocoa on cream', dot: '#2A1B12', overlay: '#E9DCC6' },
  { id: 'charcoal-newsprint', label: 'Charcoal on newsprint', dot: '#14100E', overlay: '#F2EFE6' },
  { id: 'black-marigold', label: 'Black on marigold', dot: '#101010', overlay: '#F2B705' },
  { id: 'navy-sky', label: 'Navy on sky', dot: '#071426', overlay: '#7FB2D9' },
  { id: 'forest-ivory', label: 'Forest on ivory', dot: '#1B2318', overlay: '#DDE3D5' },
  { id: 'oxblood-blush', label: 'Oxblood on blush', dot: '#2B0A0F', overlay: '#F2A9B6' },
  { id: 'black-mint', label: 'Black on mint', dot: '#08201C', overlay: '#8FE0C8' },
];
export const CUSTOM_PRESET_ID = 'custom';
export const DEFAULT_PRESET_ID = 'black-clementine';
export const MIN_PRESET_CONTRAST = 3.5;

export function paletteFromPreset(preset: ColorPreset): Palette {
  return { dot: hexToRgb(preset.dot), overlay: hexToRgb(preset.overlay) };
}

export function paletteFromColors(dot: string, overlay: string): Palette {
  return { dot: hexToRgb(dot), overlay: hexToRgb(overlay) };
}

export function assertPresetContrast(presets: readonly ColorPreset[] = COLOR_PRESETS): void {
  if (presets.length === 0) throw new Error('There are no colour presets to choose from.');
  const ids = new Set<string>();
  for (const preset of presets) {
    if (ids.has(preset.id)) throw new Error(`Duplicate colour preset id "${preset.id}"`);
    ids.add(preset.id);
    const ratio = contrastRatio(hexToRgb(preset.dot), hexToRgb(preset.overlay));
    if (ratio < MIN_PRESET_CONTRAST) {
      throw new Error(
        `Colour preset "${preset.id}" has a contrast ratio of ${ratio.toFixed(2)}:1, below the ${MIN_PRESET_CONTRAST}:1 minimum`,
      );
    }
  }
}
