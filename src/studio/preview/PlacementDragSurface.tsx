import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { dragPlacement, nudgePlacement, placementRoom, snapLine } from "@/src/banner/placement";
import type { Position } from "@/src/banner/position";
import {
  arrowStep,
  DRAG_FRAME_CLASS,
  DragBadge,
  PositionStatus,
  useMoveOncePerFrame,
  usePointerDrag,
} from "@/src/studio/preview/dragSurface";

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
 * Over an item the banner places (the content, the logo): drag it, or focus it and use the arrow
 * keys. It stops at the padding and snaps to the edges and the middle, with guide lines. A later
 * surface sits on top, like its item in the banner.
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
  const scheduleMove = useMoveOncePerFrame(onMove);

  // Measured after every render (the banner places its items in the same commit), and a frame
  // after the item or its box resizes, once the banner has re-fitted: a font or image loads, or
  // the format changes.
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

  const pointer = usePointerDrag({
    scale,
    begin: () => (rect ? { from: position, room: room(rect) } : null),
    move: ({ from, room }, delta) => {
      const next = dragPlacement(from, delta, room, SNAP_DISTANCE / scale);
      setSnapped((prev) =>
        prev.x === next.snapped.x && prev.y === next.snapped.y ? prev : next.snapped,
      );
      scheduleMove(next.position);
    },
    end: () => setSnapped({}),
  });

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
        {...pointer.handlers}
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
        className={`${DRAG_FRAME_CLASS} z-20 rounded-md`}
      >
        <DragBadge>Drag to move {name}</DragBadge>
        <PositionStatus name={name} position={position} quiet={pointer.dragging} />
      </div>
      {snapped.x === undefined ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-accent forced-color-adjust-none"
          style={{ left: snapLine(frame, "x", snapped.x) * scale }}
        />
      )}
      {snapped.y === undefined ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 h-px bg-accent forced-color-adjust-none"
          style={{ top: snapLine(frame, "y", snapped.y) * scale }}
        />
      )}
    </>
  );
}
