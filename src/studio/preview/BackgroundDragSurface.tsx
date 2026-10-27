import { useRef, type KeyboardEvent } from "react";
import {
  backgroundPanRange,
  dragBackgroundPosition,
  type BackgroundPosition,
} from "@/src/banner/background";
import { clampPercent, roundPercent } from "@/src/banner/position";
import {
  arrowStep,
  DRAG_FRAME_CLASS,
  DragBadge,
  PositionStatus,
  useMoveOncePerFrame,
  usePointerDrag,
} from "@/src/studio/preview/dragSurface";

const roundPosition = ({ x, y }: BackgroundPosition) => ({
  x: roundPercent(x),
  y: roundPercent(y),
});

/**
 * Covers the preview whenever the banner has a background: drag to move it, or focus it and use the
 * arrow keys. No mode to turn on or off. The content and the logo have their own surfaces on top
 * (`PlacementDragSurface`).
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
  const scheduleMove = useMoveOncePerFrame(onMove);

  function panRange() {
    const img = ref.current?.parentElement?.querySelector<HTMLImageElement>(
      "img[data-banner-background]",
    );
    if (!img?.naturalWidth) return null;
    return backgroundPanRange(frame, { width: img.naturalWidth, height: img.naturalHeight }, zoom);
  }

  const pointer = usePointerDrag({
    scale,
    begin: () => position,
    move: (from, delta) => {
      const range = panRange();
      if (range) scheduleMove(roundPosition(dragBackgroundPosition(from, delta, range)));
    },
  });

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = arrowStep(event);
    if (!step) return;
    event.preventDefault();
    // Arrows move the image, matching a drag: → shows more of the left side.
    onMove(
      roundPosition({ x: clampPercent(position.x - step.x), y: clampPercent(position.y - step.y) }),
    );
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label="Background position. Drag or use the arrow keys to move it."
      {...pointer.handlers}
      onKeyDown={onKeyDown}
      className={`${DRAG_FRAME_CLASS} inset-0 z-10 rounded-[inherit]`}
    >
      <DragBadge>Drag to move background</DragBadge>
      <PositionStatus name="background" position={position} quiet={pointer.dragging} />
    </div>
  );
}
