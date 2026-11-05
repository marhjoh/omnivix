import { useRef, type KeyboardEvent } from "react";
import {
  backgroundPanRange,
  dragBackgroundPosition,
  nudgeBackgroundPosition,
} from "@/src/banner/background";
import type { Position } from "@/src/banner/position";
import { BANNER_BACKGROUND_ATTRIBUTE } from "@/src/banner/placement";
import {
  arrowStep,
  DRAG_FRAME_CLASS,
  DragBadge,
  describePosition,
  PositionStatus,
  useMoveOncePerFrame,
  usePointerDrag,
} from "@/src/studio/preview/dragSurface";
import type { BannerBox } from "@/src/lib/sizes";

/**
 * Covers the preview whenever the banner has a background: drag to move it, or focus it and use the
 * arrow keys. No mode to turn on or off. The items placed on it (content, logo) have their
 * own surfaces on top (`PlacementDragSurface`).
 */
export function BackgroundDragSurface({
  position,
  zoom,
  frame,
  scale,
  onMove,
}: {
  position: Position;
  zoom: number;
  frame: BannerBox;
  scale: number;
  onMove: (position: Position) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scheduleMove = useMoveOncePerFrame(onMove);

  function panRange() {
    const img = ref.current?.parentElement?.querySelector<HTMLImageElement>(
      `img[${BANNER_BACKGROUND_ATTRIBUTE}]`,
    );
    if (!img?.naturalWidth) return null;
    return backgroundPanRange(frame, { width: img.naturalWidth, height: img.naturalHeight }, zoom);
  }

  const pointer = usePointerDrag({
    scale,
    begin: () => position,
    move: (from, delta) => {
      const range = panRange();
      if (range) scheduleMove(dragBackgroundPosition(from, delta, range));
    },
  });

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = arrowStep(event);
    if (!step) return;
    event.preventDefault();
    const range = panRange();
    if (range) onMove(nudgeBackgroundPosition(position, step, range));
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
      <PositionStatus text={`background: ${describePosition(position)}`} quiet={pointer.dragging} />
    </div>
  );
}
