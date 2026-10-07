import { useState } from "react";
import type { Scene } from "../effects/types";
import type { HalftoneSketchHandle } from "../render/halftoneSketch";

const MAX_EXPORT_PIXELS = 32_000_000;
const SCALES = [1, 2] as const;
const FORMATS = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
] as const;
type FormatId = (typeof FORMATS)[number]["id"];

const formatTypes: Record<FormatId, string> = {
  png: "image/png",
  jpg: "image/jpeg",
};

interface ExportBarProps {
  scene: Scene;
  fileName: string;
  sketchRef: { current: HalftoneSketchHandle | null };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("This browser cannot encode a canvas to a file."));
      return;
    }
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode that file."))),
      type,
      0.92,
    );
  });
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ExportBar({ scene, fileName, sketchRef }: ExportBarProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const tooLarge = (scale: number) =>
    scene.width * scene.height * scale * scale > MAX_EXPORT_PIXELS;

  async function exportAs(formatId: FormatId, scale: number) {
    const key = `${formatId}-${scale}`;
    setBusy(key);
    setNote(null);

    try {
      const sketch = sketchRef.current;
      if (sketch === null) throw new Error("The preview is not ready yet.");
      if (tooLarge(scale)) {
        throw new Error("That is over 32 megapixels. Use the 1x option.");
      }

      const canvas = sketch.renderForExport(scale);
      const suffix = scale === 1 ? "" : `@${scale}x`;
      download(await canvasToBlob(canvas, formatTypes[formatId]), `${fileName}${suffix}.${formatId}`);
    } catch (cause) {
      setNote(cause instanceof Error ? cause.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border-t border-line px-4 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Export</h2>

        {note !== null ? (
          <span role="status" className="text-xs text-accent">
            {note}
          </span>
        ) : null}
      </div>

      <div className="mt-2 space-y-1.5">
        {SCALES.map((scale) => (
          <div key={scale} className="flex items-center gap-1.5">
            <span className="w-6 text-xs text-muted">{scale}x</span>

            {FORMATS.map((format) => {
              const key = `${format.id}-${scale}`;
              return (
                <button
                  key={format.id}
                  type="button"
                  disabled={busy !== null || tooLarge(scale)}
                  onClick={() => void exportAs(format.id, scale)}
                  className="flex-1 rounded-md border border-line bg-raised px-2 py-1.5 text-xs text-text transition-colors hover:border-muted disabled:opacity-50"
                >
                  {busy === key ? "Saving…" : format.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

    </section>
  );
}
