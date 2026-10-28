import { useRef, useState, type KeyboardEvent } from "react";
import {
  describeAuthorPosition,
  moveAuthor,
  type AuthorPosition,
} from "@/src/banner/authorPosition";
import { contentBox } from "@/src/banner/fit";
import type { BannerBox } from "@/src/lib/sizes";
import { BANNER_AUTHOR_ATTRIBUTE, BANNER_CONTENT_ATTRIBUTE } from "@/src/banner/placement";
import {
  arrowStep,
  DRAG_FRAME_CLASS,
  DragBadge,
  frameAround,
  PositionStatus,
  SNAP_DISTANCE,
  SnapGuide,
  useMoveOncePerFrame,
  usePointerDrag,
} from "@/src/studio/preview/dragSurface";
import { measureRect, useItemRect } from "@/src/studio/preview/useItemRect";

/** Arrow keys move the author this many banner pixels, or more with Shift. */
const PIXEL_STEPS = { step: 4, shiftStep: 20 };

/**
 * Over the quote banner's author: drag it, or focus it and use the arrow keys. It moves across
 * the quote, snapping to its edges and center with a guide line, and down from it, within the
 * padding.
 */
export function AuthorDragSurface({
  position,
  quoteY,
  frame,
  scale,
  onMove,
}: {
  /** Undefined while it's lined up like the quote: then it's where the banner put it. */
  position: AuthorPosition | undefined;
  /** The quote's place down the banner, 0 to 100. */
  quoteY: number;
  /** Banner size in CSS pixels. */
  frame: BannerBox;
  /** Preview scale: screen pixels per banner pixel. */
  scale: number;
  onMove: (position: AuthorPosition) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rect = useItemRect(ref, BANNER_AUTHOR_ATTRIBUTE);
  const [guide, setGuide] = useState<number | undefined>();
  const scheduleMove = useMoveOncePerFrame(onMove);

  /** Where the author is, how far it can move (banner pixels), and the quote's text column. */
  function measure() {
    const preview = ref.current?.parentElement;
    const author = preview?.querySelector(`[${BANNER_AUTHOR_ATTRIBUTE}]`);
    const column = author?.parentElement;
    const block = preview?.querySelector(`[${BANNER_CONTENT_ATTRIBUTE}]`);
    if (!preview || !author || !column || !block) return null;
    const [authorRect, columnRect, blockRect] = [author, column, block].map((element) =>
      measureRect(preview, element),
    );
    const across = (columnRect.width - authorRect.width) / scale;
    return {
      from: position ?? {
        x: across < 1 ? 50 : ((authorRect.left - columnRect.left) / scale / across) * 100,
        y: 0,
      },
      room: { width: across, height: contentBox(frame).height - blockRect.height / scale },
      column: { left: columnRect.left / scale, width: columnRect.width / scale },
    };
  }

  const pointer = usePointerDrag({
    scale,
    begin: measure,
    move: ({ from, room, column }, delta) => {
      // More space above the author grows the quote's block, which keeps its place in the box:
      // the author moves by only part of it, so the space grows faster to keep up with the pointer.
      const follow = Math.max(0.5, 1 - quoteY / 100);
      const next = moveAuthor(
        from,
        { x: delta.x, y: delta.y / follow },
        room,
        SNAP_DISTANCE / scale,
      );
      const x = next.snapped.x;
      setGuide(x === undefined ? undefined : column.left + (column.width * x) / 100);
      scheduleMove(next.position);
    },
    end: () => setGuide(undefined),
  });

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = arrowStep(event, PIXEL_STEPS);
    const at = step && measure();
    if (!step || !at) return;
    event.preventDefault();
    onMove(moveAuthor(at.from, step, at.room).position);
  }

  return (
    <>
      <div
        ref={ref}
        tabIndex={0}
        role="application"
        aria-label="Author position. Drag or use the arrow keys to move it."
        {...pointer.handlers}
        onKeyDown={onKeyDown}
        style={frameAround(rect)}
        className={`${DRAG_FRAME_CLASS} z-20 rounded-md`}
      >
        <DragBadge>Drag to move author</DragBadge>
        <PositionStatus
          text={`author: ${position ? describeAuthorPosition(position) : "lined up with the quote"}`}
          quiet={pointer.dragging}
        />
      </div>
      {guide === undefined ? null : <SnapGuide axis="x" at={guide * scale} />}
    </>
  );
}
