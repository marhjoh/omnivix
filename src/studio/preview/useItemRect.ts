import { useLayoutEffect, useState, type RefObject } from "react";

/** A box on screen, relative to the preview. */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const sameRect = (a: Rect, b: Rect) =>
  a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

/** `element`'s box relative to `preview`, in screen pixels. */
export function measureRect(preview: Element, element: Element): Rect {
  const outer = preview.getBoundingClientRect();
  const inner = element.getBoundingClientRect();
  return {
    left: inner.left - outer.left,
    top: inner.top - outer.top,
    width: inner.width,
    height: inner.height,
  };
}

/**
 * The box of the banner item marked with `target`, found in the preview that holds `surface`.
 * Measured after every render (the banner places its items in the same commit), and a frame after
 * the item or its parent resizes, once the banner has re-fitted: a font or image loads, or the
 * format changes.
 */
export function useItemRect(surface: RefObject<HTMLElement | null>, target: string) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const preview = surface.current?.parentElement;
    const item = preview?.querySelector<HTMLElement>(`[${target}]`);
    if (!preview || !item) return;
    const measure = () => {
      const next = measureRect(preview, item);
      setRect((prev) => (prev && sameRect(prev, next) ? prev : next));
    };
    measure();
    let frameId = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    });
    observer.observe(item);
    if (item.parentElement) observer.observe(item.parentElement);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  });

  return rect;
}
