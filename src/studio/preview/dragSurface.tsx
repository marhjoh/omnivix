import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren,
} from "react";
import type { Position } from "@/src/banner/position";
import type { Rect } from "@/src/studio/preview/useItemRect";

/**
 * What the preview's drag surfaces share (`BackgroundDragSurface`, `PlacementDragSurface`,
 * `AuthorDragSurface`): arrow keys, drags measured from where they started, the dashed frame with
 * its badge, and snap guides.
 */

/**
 * The dashed frame of a drag surface. It and the badge show on hover, focus and while dragging, so
 * the banner reads clean otherwise. Forced colors would show the transparent frame all the time.
 */
export const DRAG_FRAME_CLASS =
  "forced-color-adjust-none group absolute cursor-grab touch-none border-2 border-dashed border-transparent transition-colors duration-150 hover:border-accent focus-visible:border-accent focus-visible:outline-none active:cursor-grabbing active:border-accent";

/** An item snaps to a guide within this many screen pixels. */
export const SNAP_DISTANCE = 6;

/** Space between an item and its dashed frame, in screen pixels. */
const FRAME_GAP = 4;

/** Places a drag surface's frame around its item; hidden until the item is measured. */
export function frameAround(rect: Rect | null): CSSProperties {
  return rect
    ? {
        left: rect.left - FRAME_GAP,
        top: rect.top - FRAME_GAP,
        width: rect.width + 2 * FRAME_GAP,
        height: rect.height + 2 * FRAME_GAP,
      }
    : { visibility: "hidden" };
}

const ACROSS: Record<number, string> = { 0: "left", 50: "center", 100: "right" };
const DOWN: Record<number, string> = { 0: "top", 50: "middle", 100: "bottom" };

/** Where something is, in words: "left, top", or "37% from the left, 20% from the top". */
export function describePosition({ x, y }: Position): string {
  const across = ACROSS[x] ?? `${Math.round(x)}% from the left`;
  const down = DOWN[y] ?? `${Math.round(y)}% from the top`;
  return `${across}, ${down}`;
}

/**
 * Tells screen readers where something is (`text`, e.g. "logo: left, top") when it moves; during a
 * drag (`quiet`), at its end. A click that doesn't move it says nothing.
 */
export function PositionStatus({ text, quiet }: { text: string; quiet: boolean }) {
  const [initial] = useState(text);
  const [said, setSaid] = useState("");
  if (!quiet && text !== said && (said || text !== initial)) setSaid(text);
  return (
    <span className="sr-only" aria-live="polite">
      {said}
    </span>
  );
}

/** A guide line across the preview where a dragged item has snapped, at `at` screen pixels. */
export function SnapGuide({ axis, at }: { axis: "x" | "y"; at: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-20 bg-accent forced-color-adjust-none ${
        axis === "x" ? "inset-y-0 w-px" : "inset-x-0 h-px"
      }`}
      style={axis === "x" ? { left: at } : { top: at }}
    />
  );
}

/** Says what dragging moves, in the frame's top left corner. */
export function DragBadge({ children }: PropsWithChildren) {
  return (
    <span className="pointer-events-none absolute top-1 left-1 rounded-md bg-accent-fill px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
      {children}
    </span>
  );
}

/** Arrow keys move this many percent, or more with Shift. */
const PERCENT_STEPS = { step: 2, shiftStep: 10 };

/** The arrow key's direction times its step, or null for other keys. */
export function arrowStep(
  event: KeyboardEvent,
  { step: small, shiftStep } = PERCENT_STEPS,
): { x: number; y: number } | null {
  const step = event.shiftKey ? shiftStep : small;
  return (
    {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key] ?? null
  );
}

/** Moves are applied once per frame; pointer events can fire faster than the screen updates. */
export function useMoveOncePerFrame(onMove: (position: Position) => void) {
  const moveFrame = useRef<number | null>(null);
  const pending = useRef<Position | null>(null);

  useEffect(() => () => cancelAnimationFrame(moveFrame.current ?? 0), []);

  return (next: Position) => {
    pending.current = next;
    moveFrame.current ??= requestAnimationFrame(() => {
      moveFrame.current = null;
      if (pending.current) onMove(pending.current);
    });
  };
}

/**
 * Pointer handlers for a drag measured from where it started, so what's dragged follows the
 * pointer exactly. `begin` returns what the drag needs, or null to ignore the press; `move` gets
 * it with how far the pointer has moved, in banner pixels. `dragging` is true until it ends.
 */
export function usePointerDrag<T>({
  scale,
  begin,
  move,
  end,
}: {
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  begin: () => T | null;
  move: (start: T, delta: { x: number; y: number }) => void;
  end?: () => void;
}) {
  const drag = useRef<{ x: number; y: number; start: T } | null>(null);
  const [dragging, setDragging] = useState(false);

  const stop = () => {
    drag.current = null;
    setDragging(false);
    end?.();
  };

  return {
    dragging,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        const start = begin();
        if (start === null) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY, start };
        setDragging(true);
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const current = drag.current;
        if (!current) return;
        move(current.start, {
          x: (event.clientX - current.x) / scale,
          y: (event.clientY - current.y) / scale,
        });
      },
      onPointerUp: stop,
      onPointerCancel: stop,
    },
  };
}
