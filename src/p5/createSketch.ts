import p5 from 'p5';

export interface Size {
  width: number;
  height: number;
}

export interface SketchDefinition {
  /** Canvas size, read again whenever the window or container changes. */
  readSize: () => Size;
  /** p5's setup. Return the function p5 should call every frame. */
  setup: (p: p5) => void | ((p: p5) => void);
  /** Runs at the end of setup, once p5 has a canvas and a loop. */
  onReady?: (p: p5) => void;
  /** Called after a resize, before the next frame. */
  onResize?: (p: p5) => void;
  /** One line describing the sketch, for the canvas element. */
  description?: string;
  /**
   * Defaults to p5's normal running loop. Set false for a sketch that holds
   * still: it then runs noLoop() and repaints only when apply() is called.
   */
  loop?: boolean;
}

export interface SketchHandle {
  /** Repaint now. Call this when React state the sketch reads has changed. */
  apply: () => void;
  remove: () => void;
}

export function createSketch(host: HTMLDivElement, definition: SketchDefinition): SketchHandle {
  let paint: ((p: p5) => void) | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ready = false;
  let gone = false;
  let pendingFrame = false;

  function pinCanvas(p: p5) {
    canvas = (p as unknown as { canvas: HTMLCanvasElement }).canvas;

    if (gone) {
      canvas.remove();
      canvas = null;
      return;
    }

    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
  }

  const instance = new p5((p) => {
    p.setup = () => {
      if (gone) return;
      const size = definition.readSize();
      p.createCanvas(Math.max(1, size.width), Math.max(1, size.height));
      p.pixelDensity(Math.min(2, globalThis.devicePixelRatio || 1));
      if (definition.description !== undefined) p.describe(definition.description);
      if (definition.loop === false) p.noLoop();
      pinCanvas(p);
      const returned = definition.setup(p);
      paint = typeof returned === 'function' ? returned : null;
      ready = true;
      definition.onReady?.(p);

      if (pendingFrame) {
        pendingFrame = false;
        p.redraw();
      }
    };

    p.draw = () => {
      if (!ready || gone) return;
      const size = definition.readSize();
      if (size.width !== p.width || size.height !== p.height) {
        p.resizeCanvas(Math.max(1, size.width), Math.max(1, size.height));
        pinCanvas(p);
        definition.onResize?.(p);
      }

      paint?.(p);
    };
  }, host);

  return {
    apply: () => {
      if (gone) return;
      if (!ready) {
        pendingFrame = true;
        return;
      }
      instance.redraw();
    },
    remove: () => {
      gone = true;
      instance.remove();
      canvas?.remove();
      canvas = null;
      const orphan = (instance as unknown as { canvas?: HTMLCanvasElement }).canvas;
      if (orphan !== undefined && orphan.parentNode !== null) orphan.remove();
      queueMicrotask(() => {
        const late = (instance as unknown as { canvas?: HTMLCanvasElement }).canvas;
        if (late !== undefined && late.parentNode !== null) late.remove();
      });
    },
  };
}
