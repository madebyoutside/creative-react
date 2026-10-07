import type { Scene } from "../effects/types";
import { COLOR_PRESETS, CUSTOM_PRESET_ID } from "../effects/halftone/presets";
import { MAX_PITCH, MIN_PITCH } from "../effects/halftone";
import type { ImageLoader } from "../lib/useImageLoader";
import { ColorField } from "./ColorField";
import { ExportBar } from "./ExportBar";
import type { HalftoneSketchHandle } from "../render/halftoneSketch";
import { PanelButton } from "./PanelButton";
import { CustomPresetButton, PresetButton } from "./PresetButton";
import { Section } from "./Section";
import { Slider } from "./Slider";

interface ControlsPanelProps {
  loader: ImageLoader;
  spacing: number;
  onSpacingChange: (value: number) => void;
  presetId: string;
  onPresetChange: (id: string) => void;
  customDot: string;
  customOverlay: string;
  onCustomDotChange: (hex: string) => void;
  onCustomOverlayChange: (hex: string) => void;
  onSwapColors: () => void;
  scene: Scene | null;
  pictureSize: { width: number; height: number } | null;
  /** Shown under the image section when a load is slow or has failed. */
  loadMessage?: string | null;
  exportName: string;
  sketchRef: { current: HalftoneSketchHandle | null };
}

export function ControlsPanel({
  loader,
  spacing,
  onSpacingChange,
  presetId,
  onPresetChange,
  customDot,
  customOverlay,
  onCustomDotChange,
  onCustomOverlayChange,
  onSwapColors,
  scene,
  pictureSize,
  loadMessage,
  exportName,
  sketchRef,
}: ControlsPanelProps) {
  const presetIds = [
    ...COLOR_PRESETS.map((preset) => preset.id),
    CUSTOM_PRESET_ID,
  ];

  const onPresetKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const at = Math.max(0, presetIds.indexOf(presetId));
    const next = presetIds[(at + step + presetIds.length) % presetIds.length];
    onPresetChange(next);
  };

  return (
    <aside className="flex min-h-0 w-full flex-col overflow-y-auto border-line bg-panel md:w-[22rem] md:border-l">
      <Section title="Image">
        <input {...loader.inputProps} aria-label="Image file" />
        <PanelButton onClick={loader.openPicker} prominent>
          {loader.file === null ? "Choose an image" : "Replace image"}
        </PanelButton>

        <p className="text-xs text-muted">
          {pictureSize === null
            ? "JPEG, PNG, WebP, or AVIF. You can also drop a file on the preview or paste one."
            : `${pictureSize.width} × ${pictureSize.height} px`}
          {loadMessage ? ` ${loadMessage}` : ""}
        </p>

      </Section>

      <Section title="Dot size">
        <Slider
          id="dot-size"
          min={MIN_PITCH}
          max={MAX_PITCH}
          step={0.5}
          value={spacing}
          unit="px"
          onChange={onSpacingChange}
        />

      </Section>

      <Section title="Colours">
        <div
          role="radiogroup"
          aria-label="Colour preset"
          className="grid grid-cols-3 gap-2"
          onKeyDown={onPresetKeyDown}
        >
          {COLOR_PRESETS.map((preset) => (
            <PresetButton
              key={preset.id}
              preset={preset}
              active={preset.id === presetId}
              onSelect={onPresetChange}
            />
          ))}
          <CustomPresetButton
            dot={customDot}
            overlay={customOverlay}
            active={presetId === CUSTOM_PRESET_ID}
            onSelect={onPresetChange}
          />

        </div>

        {presetId === CUSTOM_PRESET_ID ? (
          <div className="grid grid-cols-2 gap-2">
            <ColorField
              label="Dots"
              value={customDot}
              onChange={onCustomDotChange}
            />

            <ColorField
              label="Background"
              value={customOverlay}
              onChange={onCustomOverlayChange}
            />

          </div>
        ) : null}

        <PanelButton onClick={onSwapColors}>
          Swap dots and background
        </PanelButton>

      </Section>

      {scene !== null ? (
        <ExportBar scene={scene} fileName={exportName} sketchRef={sketchRef} />
      ) : null}
    </aside>
  );
}
