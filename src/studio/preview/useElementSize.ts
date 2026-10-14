import { useLayoutEffect, useRef, useState } from "react";

type Size = { width: number; height: number };

function contentBoxSize(el: HTMLElement): Size {
  const style = getComputedStyle(el);
  return {
    width: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    height: el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  };
}

/**
 * Content-box size of an element, kept up to date with ResizeObserver.
 * Measured once in a layout effect, so the first paint already has it.
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
    update(contentBoxSize(el));
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
