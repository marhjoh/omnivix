import { useLayoutEffect, useRef, useState } from "react";

type Size = { width: number; height: number };

/**
 * Content-box size of an element without padding, kept up to date with ResizeObserver. Measured
 * once in a layout effect, so the first paint already has it.
 */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = ({ width, height }: Size) =>
      setSize((prev) =>
        prev && prev.width === width && prev.height === height ? prev : { width, height },
      );
    update({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
