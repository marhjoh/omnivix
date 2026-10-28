import { useRef, useState, type KeyboardEvent } from "react";
import { dragPlacement, nudgePlacement, placementRoom, snapLine } from "@/src/banner/placement";
import type { Position } from "@/src/banner/position";
import type { BannerBox, Rect as BannerRect } from "@/src/lib/sizes";
import {
  arrowStep,
  describePosition,
  DRAG_FRAME_CLASS,
  DragBadge,
  frameAround,
  PositionStatus,
  SNAP_DISTANCE,
  SnapGuide,
  useMoveOncePerFrame,
  usePointerDrag,
} from "@/src/studio/preview/dragSurface";
import { useItemRect, type Rect } from "@/src/studio/preview/useItemRect";

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
  shown,
  scale,
  onMove,
}: {
  /** The attribute that marks the item in the banner, e.g. `BANNER_CONTENT_ATTRIBUTE`. */
  target: string;
  /** What the item is called, e.g. "content", for its label and badge. */
  name: string;
  position: Position;
  /** Banner size in CSS pixels. */
  frame: BannerBox;
  /** The part of the banner the preview shows, in CSS pixels. */
  shown: BannerRect;
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  onMove: (position: Position) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rect = useItemRect(ref, target);
  const [snapped, setSnapped] = useState<Partial<Position>>({});
  const scheduleMove = useMoveOncePerFrame(onMove);

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
        style={frameAround(rect)}
        className={`${DRAG_FRAME_CLASS} z-20 rounded-md`}
      >
        <DragBadge>Drag to move {name}</DragBadge>
        <PositionStatus text={`${name}: ${describePosition(position)}`} quiet={pointer.dragging} />
      </div>
      {snapped.x === undefined ? null : (
        <SnapGuide axis="x" at={(snapLine(frame, "x", snapped.x) - shown.left) * scale} />
      )}
      {snapped.y === undefined ? null : (
        <SnapGuide axis="y" at={(snapLine(frame, "y", snapped.y) - shown.top) * scale} />
      )}
    </>
  );
}
