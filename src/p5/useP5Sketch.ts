import { useEffect, useRef, type RefObject } from 'react';
import { createSketch, type SketchDefinition, type SketchHandle } from './createSketch';

/**
 * Mounts a sketch into a container and keeps it in step with React.
 *
 * `resetKey` tears the sketch down and builds it again, which is what you want
 * when the thing being drawn is replaced rather than adjusted. `deps` only asks
 * for another frame.
 */
export function useP5Sketch(
  containerRef: RefObject<HTMLElement | null>,
  definition: SketchDefinition,
  deps: unknown[] = [],
  resetKey?: unknown,
): RefObject<SketchHandle | null> {
  const handleRef = useRef<SketchHandle | null>(null);
  const latest = useRef(definition);
  latest.current = definition;

  useEffect(() => {
    const host = containerRef.current;
    if (host === null) return;
    let handle: SketchHandle | null = null;
    let frame = 0;
    let stopped = false;
    let box: HTMLDivElement | null = null;

    const mount = () => {
      if (stopped) return;

      if (host.clientWidth < 2 || host.clientHeight < 2) {
        frame = requestAnimationFrame(mount);
        return;
      }

      box = host.ownerDocument.createElement('div');
      box.style.position = 'absolute';
      box.style.inset = '0';
      host.replaceChildren(box);

      handle = createSketch(box, {
        readSize: () => latest.current.readSize(),
        setup: (p) => latest.current.setup(p),
        onReady: (p) => latest.current.onReady?.(p),
        onResize: (p) => latest.current.onResize?.(p),
        description: latest.current.description,
        loop: latest.current.loop,
      });
      handleRef.current = handle;
    };
    mount();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      handleRef.current = null;
      handle?.remove();
      box?.remove();
    };
  }, [containerRef, resetKey]);

  useEffect(() => {
    handleRef.current?.apply();
  }, deps);

  return handleRef;
}
