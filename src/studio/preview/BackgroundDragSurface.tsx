import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import {
  backgroundPanRange,
  dragBackgroundPosition,
  type BackgroundPosition,
} from "@/src/banner/background";

/** Arrow keys move the background this many percent; with Shift, `LARGE_STEP`. */
const STEP = 2;
const LARGE_STEP = 10;

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Covers the preview while the background is being adjusted: drag to move it, arrow keys to nudge
 * it, Escape or Enter to finish. Drags are measured from where they started, so the image follows
 * the pointer exactly.
 */
export function BackgroundDragSurface({
  position,
  zoom,
  frame,
  scale,
  onMove,
  onDone,
}: {
  position: BackgroundPosition;
  zoom: number;
  /** Banner size in CSS pixels. */
  frame: { width: number; height: number };
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  onMove: (position: BackgroundPosition) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; from: BackgroundPosition } | null>(null);
  /** Moves are applied once per frame; pointer events can fire faster than the screen updates. */
  const moveFrame = useRef<number | null>(null);
  const pending = useRef<BackgroundPosition | null>(null);

  useEffect(() => () => cancelAnimationFrame(moveFrame.current ?? 0), []);

  function scheduleMove(next: BackgroundPosition) {
    pending.current = next;
    moveFrame.current ??= requestAnimationFrame(() => {
      moveFrame.current = null;
      if (pending.current) onMove(pending.current);
    });
  }

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  function panRange() {
    const img = ref.current?.parentElement?.querySelector<HTMLImageElement>(
      "img[data-banner-background]",
    );
    if (!img?.naturalWidth) return null;
    return backgroundPanRange(frame, { width: img.naturalWidth, height: img.naturalHeight }, zoom);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, from: position };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const range = start && panRange();
    if (!start || !range) return;
    const next = dragBackgroundPosition(
      start.from,
      { x: (event.clientX - start.x) / scale, y: (event.clientY - start.y) / scale },
      range,
    );
    scheduleMove({ x: round(next.x), y: round(next.y) });
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" || event.key === "Enter") {
      event.preventDefault();
      onDone();
      return;
    }
    const step = event.shiftKey ? LARGE_STEP : STEP;
    // Arrows move the image, matching a drag: → shows more of the left side.
    const delta = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    const clamp = (value: number) => Math.min(100, Math.max(0, value));
    onMove({ x: round(clamp(position.x + delta.x)), y: round(clamp(position.y + delta.y)) });
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label="Background position. Drag or use the arrow keys to move it; press Escape when done."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-10 cursor-grab touch-none rounded-[inherit] border-2 border-dashed border-accent focus-visible:outline-none active:cursor-grabbing"
    >
      <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
        Drag to move
      </span>
    </div>
  );
}
