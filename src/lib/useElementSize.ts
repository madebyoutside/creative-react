import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (width: number, height: number) => {
      setSize((current) =>
        Math.round(current.width) === Math.round(width) && Math.round(current.height) === Math.round(height)
          ? current
          : { width, height },
      );
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize?.[0];
      if (box) update(box.inlineSize, box.blockSize);
      else update(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    update(element.clientWidth, element.clientHeight);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}
