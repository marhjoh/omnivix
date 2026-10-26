import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { dragPlacement, nudgePlacement, placementRoom, snapLine } from "@/src/banner/placement";
import type { Position } from "@/src/banner/position";
import { arrowStep, useMoveOncePerFrame } from "@/src/studio/preview/dragMoves";

/** An item snaps to an edge or the middle within this many screen pixels. */
const SNAP_DISTANCE = 6;

/** Space between the item and its dashed frame, in screen pixels. */
const FRAME_GAP = 4;

/** The item's box on screen, relative to the preview. */
interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const sameRect = (a: Rect, b: Rect) =>
  a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

/**
 * Sits over an item the banner places (the content, the logo), above the background's surface:
 * drag the item to move it, or focus it and use the arrow keys. It stops at the banner's padding
 * and snaps to the edges and the middle, with a guide line while it's snapped. A later surface sits
 * above an earlier one, as the banner draws its items.
 */
export function PlacementDragSurface({
  target,
  name,
  position,
  frame,
  scale,
  onMove,
}: {
  /** The attribute that marks the item in the banner, e.g. `BANNER_CONTENT_ATTRIBUTE`. */
  target: string;
  /** What the item is called, e.g. "content", for its label and badge. */
  name: string;
  position: Position;
  /** Banner size in CSS pixels. */
  frame: { width: number; height: number };
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  onMove: (position: Position) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [snapped, setSnapped] = useState<Partial<Position>>({});
  const drag = useRef<{
    x: number;
    y: number;
    from: Position;
    room: { width: number; height: number };
  } | null>(null);
  const scheduleMove = useMoveOncePerFrame(onMove);

  // Measured after every render, as the banner places its items in the same commit, and when the
  // item or its box changes size later: a web font or an image loads, or the format changes. The
  // banner re-fits on those itself, so the measure waits a frame for it.
  useLayoutEffect(() => {
    const preview = ref.current?.parentElement;
    const item = preview?.querySelector<HTMLElement>(`[${target}]`);
    if (!preview || !item) return;
    const measure = () => {
      const outer = preview.getBoundingClientRect();
      const inner = item.getBoundingClientRect();
      const next = {
        left: inner.left - outer.left,
        top: inner.top - outer.top,
        width: inner.width,
        height: inner.height,
      };
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

  /** How far the item can move, in banner pixels. */
  function room(box: Rect) {
    return placementRoom(frame, { width: box.width / scale, height: box.height / scale });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, from: position, room: room(rect) };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    const next = dragPlacement(
      start.from,
      { x: (event.clientX - start.x) / scale, y: (event.clientY - start.y) / scale },
      start.room,
      SNAP_DISTANCE / scale,
    );
    setSnapped((prev) =>
      prev.x === next.snapped.x && prev.y === next.snapped.y ? prev : next.snapped,
    );
    scheduleMove(next.position);
  }

  function onPointerUp() {
    drag.current = null;
    setSnapped({});
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = arrowStep(event);
    if (!step || !rect) return;
    event.preventDefault();
    onMove(nudgePlacement(position, step, room(rect)));
  }

  return (
    <>
      <div
        ref={ref}
        tabIndex={0}
        role="application"
        aria-label={`${name[0].toUpperCase()}${name.slice(1)} position. Drag or use the arrow keys to move it.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={
          rect
            ? {
                left: rect.left - FRAME_GAP,
                top: rect.top - FRAME_GAP,
                width: rect.width + 2 * FRAME_GAP,
                height: rect.height + 2 * FRAME_GAP,
              }
            : { visibility: "hidden" }
        }
        className="group absolute z-20 cursor-grab touch-none rounded-md border-2 border-dashed border-transparent transition-colors duration-150 hover:border-accent focus-visible:border-accent focus-visible:outline-none active:cursor-grabbing active:border-accent"
      >
        {/* Like the background's: the dashed frame and this badge show on hover, focus and while
            dragging. */}
        <span className="pointer-events-none absolute top-1 left-1 rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
          Drag to move {name}
        </span>
      </div>
      {snapped.x === undefined ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-accent"
          style={{ left: snapLine(frame, "x", snapped.x) * scale }}
        />
      )}
      {snapped.y === undefined ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 h-px bg-accent"
          style={{ top: snapLine(frame, "y", snapped.y) * scale }}
        />
      )}
    </>
  );
}
