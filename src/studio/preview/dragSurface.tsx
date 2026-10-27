import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren,
} from "react";
import type { Position } from "@/src/banner/position";

/**
 * What the preview's drag surfaces share (`BackgroundDragSurface`, `PlacementDragSurface`): arrow
 * keys, drags measured from where they started, and the dashed frame with its badge.
 */

/**
 * The dashed frame of a drag surface. It and the badge show on hover, focus and while dragging, so
 * the banner reads clean otherwise. Forced colors would show the transparent frame all the time.
 */
export const DRAG_FRAME_CLASS =
  "forced-color-adjust-none group absolute cursor-grab touch-none border-2 border-dashed border-transparent transition-colors duration-150 hover:border-accent focus-visible:border-accent focus-visible:outline-none active:cursor-grabbing active:border-accent";

const ACROSS: Record<number, string> = { 0: "left", 50: "center", 100: "right" };
const DOWN: Record<number, string> = { 0: "top", 50: "middle", 100: "bottom" };

/** Where something is, in words: "left, top", or "37% from the left, 20% from the top". */
export function describePosition({ x, y }: Position): string {
  const across = ACROSS[x] ?? `${Math.round(x)}% from the left`;
  const down = DOWN[y] ?? `${Math.round(y)}% from the top`;
  return `${across}, ${down}`;
}

/** Tells screen readers where `name` is once it has moved; during a drag (`quiet`), at its end. */
export function PositionStatus({
  name,
  position,
  quiet,
}: {
  name: string;
  position: Position;
  quiet: boolean;
}) {
  const [initial] = useState(position);
  const [moved, setMoved] = useState(false);
  if (!moved && (position.x !== initial.x || position.y !== initial.y)) setMoved(true);
  return (
    <span className="sr-only" aria-live="polite">
      {moved && !quiet ? `${name}: ${describePosition(position)}` : ""}
    </span>
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

/** Arrow keys move this many percent; with Shift, `LARGE_STEP`. */
const STEP = 2;
const LARGE_STEP = 10;

/** The arrow key's direction times its step, or null for other keys. */
export function arrowStep(event: KeyboardEvent): { x: number; y: number } | null {
  const step = event.shiftKey ? LARGE_STEP : STEP;
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
