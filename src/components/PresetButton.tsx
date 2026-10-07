import { CUSTOM_PRESET_ID, type ColorPreset } from "../effects/halftone/presets";
import { Swatch } from "./Swatch";

interface PresetButtonProps {
  preset: Pick<ColorPreset, "id" | "label" | "dot" | "overlay">;
  active: boolean;
  onSelect: (id: string) => void;
}

export function PresetButton({ preset, active, onSelect }: PresetButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      title={preset.label}
      onClick={() => onSelect(preset.id)}
      className={`rounded-md border p-1 transition-colors ${
        active ? "border-accent" : "border-line hover:border-muted"
      }`}
    >
      <Swatch dot={preset.dot} overlay={preset.overlay} />

      <span className="mt-1 block truncate text-[0.625rem] text-muted">
        {preset.label}
      </span>

    </button>
  );
}
interface CustomPresetButtonProps {
  dot: string;
  overlay: string;
  active: boolean;
  onSelect: (id: string) => void;
}

export function CustomPresetButton({
  dot,
  overlay,
  active,
  onSelect,
}: CustomPresetButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      title="Custom colours"
      onClick={() => onSelect(CUSTOM_PRESET_ID)}
      className={`rounded-md border p-1 transition-colors ${
        active ? "border-accent" : "border-line hover:border-muted"
      }`}
    >
      <Swatch dot={dot} overlay={overlay} />

      <span className="mt-1 block text-[0.625rem] text-muted">Custom</span>

    </button>
  );
}
