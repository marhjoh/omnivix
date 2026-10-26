import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Position } from "@/src/banner/position";

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
