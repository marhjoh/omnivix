import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import {
  backgroundPanRange,
  dragBackgroundPosition,
  type BackgroundPosition,
} from "@/src/banner/background";
import { arrowStep, useMoveOncePerFrame } from "@/src/studio/preview/dragMoves";

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Covers the preview whenever the banner has a background: drag to move it, or focus it and use the
 * arrow keys. No mode to turn on or off. Drags are measured from where they started, so the image
 * follows the pointer exactly. The content has its own surface on top (`ContentDragSurface`).
 */
export function BackgroundDragSurface({
  position,
  zoom,
  frame,
  scale,
  onMove,
}: {
  position: BackgroundPosition;
  zoom: number;
  /** Banner size in CSS pixels. */
  frame: { width: number; height: number };
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  onMove: (position: BackgroundPosition) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; from: BackgroundPosition } | null>(null);
  const scheduleMove = useMoveOncePerFrame(onMove);

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
    const step = arrowStep(event);
    if (!step) return;
    event.preventDefault();
    // Arrows move the image, matching a drag: → shows more of the left side.
    const clamp = (value: number) => Math.min(100, Math.max(0, value));
    onMove({ x: round(clamp(position.x - step.x)), y: round(clamp(position.y - step.y)) });
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label="Background position. Drag or use the arrow keys to move it."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="group absolute inset-0 z-10 cursor-grab touch-none rounded-[inherit] border-2 border-dashed border-transparent transition-colors duration-150 hover:border-accent focus-visible:border-accent focus-visible:outline-none active:cursor-grabbing active:border-accent"
    >
      {/* The dashed frame and this badge show on hover, focus and while dragging, so the banner
          reads clean otherwise. */}
      <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
        Drag to move background
      </span>
    </div>
  );
}
