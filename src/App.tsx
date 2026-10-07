import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createHalftoneSketch } from "./render/halftoneSketch";
import type { HalftoneSketchHandle } from "./render/halftoneSketch";
import { ControlsPanel } from "./components/ControlsPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useElementSize } from "./lib/useElementSize";
import { useImageLoader } from "./lib/useImageLoader";
import { useP5Sketch } from "./p5/useP5Sketch";
import { REFERENCE_SPACING } from "./effects/halftone";
import { hexToRgb, contrastRatio, inksOver, toneOf } from "./lib/color";
import {
  COLOR_PRESETS,
  CUSTOM_PRESET_ID,
  DEFAULT_PRESET_ID,
  MIN_PRESET_CONTRAST,
  assertPresetContrast,
} from "./effects/halftone/presets";
import type { Scene } from "./effects/types";
if (import.meta.env.DEV) assertPresetContrast();
const fallbackPreset = COLOR_PRESETS[0];

export default function App() {
  const loader = useImageLoader();
  const stage = useElementSize<HTMLDivElement>();
  const [scene, setScene] = useState<Scene | null>(null);
  const [picture, setPicture] = useState<{ width: number; height: number } | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [spacing, setSpacing] = useState(REFERENCE_SPACING);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [customDot, setCustomDot] = useState(fallbackPreset.dot);
  const [customOverlay, setCustomOverlay] = useState(fallbackPreset.overlay);

  const onScene = useCallback((next: Scene | null) => {
    setScene(next);
    setReadError(null);
  }, []);

  const onPicture = useCallback(
    (size: { width: number; height: number } | null) => setPicture(size),
    [],
  );
  const onError = useCallback((message: string) => setReadError(message), []);

  const settings = useRef({
    spacing,
    paletteId: presetId,
    customDot,
    customOverlay,
    width: Math.max(1, Math.round(stage.size.width)),
    height: Math.max(1, Math.round(stage.size.height)),
    onScene,
    onPicture,
    onError,
  });
  settings.current = {
    spacing,
    paletteId: presetId,
    customDot,
    customOverlay,
    width: Math.max(1, Math.round(stage.size.width)),
    height: Math.max(1, Math.round(stage.size.height)),
    onScene,
    onPicture,
    onError,
  };
  const halftone = useMemo(() => createHalftoneSketch(() => settings.current), []);
  const sketchRef = useRef<HalftoneSketchHandle | null>(null);
  const canvas = useRef<HTMLDivElement | null>(null);

  useP5Sketch(canvas, halftone.definition, [
    spacing,
    presetId,
    customDot,
    customOverlay,
    stage.size.width,
    stage.size.height,
  ]);
  useEffect(() => () => halftone.handle.remove(), [halftone]);

  useEffect(() => {
    if (loader.file === null) {
      sketchRef.current = null;
      setScene(null);
      setPicture(null);
      return;
    }
    sketchRef.current = halftone.handle;
    halftone.handle.loadPicture(loader.file);
  }, [halftone, loader.file, loader.sourceKey]);
  const [slowDecode, setSlowDecode] = useState(false);
  useEffect(() => {
    if (loader.file === null) {
      setSlowDecode(false);
      return;
    }
    const timer = setTimeout(() => setSlowDecode(halftone.handle.isDecoding()), 3000);
    return () => clearTimeout(timer);
  }, [halftone, loader.file, loader.sourceKey]);

  const exportName = `${
    loader.file?.name.replace(/\.[^.]+$/, "") ?? "image"
  }-halftone-${spacing}px`;

  const contrastError = useMemo(() => {
    if (presetId !== CUSTOM_PRESET_ID) return null;
    const dot = hexToRgb(customDot);
    const overlay = hexToRgb(customOverlay);
    if (!inksOver(dot, overlay)) {
      return "The dots have to be darker than the background, or there is no ink to lay down.";
    }

    const ratio = contrastRatio(dot, overlay);
    if (ratio >= MIN_PRESET_CONTRAST) return null;
    return `Dots and background are too close in tone to tell apart (${ratio.toFixed(1)}:1).`;
  }, [presetId, customDot, customOverlay]);

  const activeColours = useMemo(() => {
    const preset = COLOR_PRESETS.find((candidate) => candidate.id === presetId);
    if (preset !== undefined) return { dot: preset.dot, overlay: preset.overlay };
    return { dot: customDot, overlay: customOverlay };
  }, [presetId, customDot, customOverlay]);

  const onSwapColors = useCallback(() => {
    const { dot, overlay } = activeColours;
    const dotIsDarker = toneOf(hexToRgb(dot)) <= toneOf(hexToRgb(overlay));
    setCustomDot(dotIsDarker ? overlay : dot);
    setCustomOverlay(dotIsDarker ? dot : overlay);
    setPresetId(CUSTOM_PRESET_ID);
  }, [activeColours]);
  const error = contrastError ?? readError ?? loader.error;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          ref={stage.ref}
          className="relative h-[45vh] shrink-0 overflow-hidden bg-bg md:h-auto md:min-h-0 md:flex-1"
          {...loader.dropHandlers}
        >
          <ErrorBoundary
            fallback={(caught, reset) => (
              <div className="absolute inset-0 grid place-items-center p-6">
                <div className="max-w-md text-center">
                  <p className="text-sm">The preview stopped drawing.</p>

                  <p className="mt-1 font-mono text-xs text-accent">{caught.message}</p>

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-3 rounded-md border border-line bg-raised px-3 py-1.5 text-sm transition-colors hover:border-muted"
                  >
                    Try again
                  </button>

                </div>

              </div>
            )}
          >
            {}
            <div ref={canvas} className="absolute inset-0" />
          </ErrorBoundary>

          {loader.file === null ? (
            <div className="absolute inset-0 grid place-items-center bg-bg px-6 text-center">
              <div className="max-w-sm">
                <p className="text-base">Drop an image here</p>

                <p className="mt-1 text-sm text-muted">
                  Or paste one with ⌘V. Dots are drawn the moment the file is read.
                </p>

                <button
                  type="button"
                  onClick={loader.openPicker}
                  className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg"
                >
                  Choose an image
                </button>

              </div>

            </div>
          ) : null}

          {loader.dragging ? (
            <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-accent bg-bg/60" />
          ) : null}
        </div>

        <ControlsPanel
          loader={loader}
          spacing={spacing}
          onSpacingChange={setSpacing}
          presetId={presetId}
          onPresetChange={setPresetId}
          customDot={customDot}
          customOverlay={customOverlay}
          onCustomDotChange={setCustomDot}
          onCustomOverlayChange={setCustomOverlay}
          onSwapColors={onSwapColors}
          scene={scene}
          pictureSize={picture}
          loadMessage={
            slowDecode ? "Still reading that image. Large files can take a moment." : null
          }
          exportName={exportName}
          sketchRef={sketchRef}
        />

      </main>

      {error !== null ? (
        <p
          role="status"
          className="border-t border-line bg-panel px-4 py-2 text-sm text-accent"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
