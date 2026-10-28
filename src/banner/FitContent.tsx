"use client";

import { PropsWithChildren, useEffectEvent, useLayoutEffect, useRef } from "react";
import { CONTENT_SIZE_FACTOR, type ContentSize } from "@/src/banner/contentSize";
import { type ContentPosition } from "@/src/banner/contentPosition";
import { FIT_STATUS_ATTRIBUTE, fitScale } from "@/src/banner/fit";
import { BANNER_CONTENT_ATTRIBUTE } from "@/src/banner/placement";
import type { Rect } from "@/src/lib/sizes";

/**
 * Scales content laid out at its natural size to fit the banner: `xl` is the largest scale that
 * fits the padded box (`contentBox`), smaller sizes are fractions of it (see `contentSize.ts`).
 *
 * The scale is a CSS transform, so text and SVG stay sharp. It is written to the DOM after layout
 * rather than kept in state, since it depends only on measured sizes. The content is placed at
 * `position` in the room left around it inside the padded box.
 */
export function FitContent({
  children,
  box,
  size,
  position,
}: PropsWithChildren<{ box: Rect; size: ContentSize; position: ContentPosition }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fit = useEffectEvent(() => {
    const container = containerRef.current;
    const scaler = scalerRef.current;
    const content = contentRef.current;
    if (!container || !scaler || !content) return;

    if (box.width <= 0 || box.height <= 0) return;

    const natural = { width: content.offsetWidth, height: content.offsetHeight };
    const scale = fitScale(box, natural) * CONTENT_SIZE_FACTOR[size];
    const room = {
      width: box.width - natural.width * scale,
      height: box.height - natural.height * scale,
    };
    scaler.style.left = `${box.left + (room.width * position.x) / 100}px`;
    scaler.style.top = `${box.top + (room.height * position.y) / 100}px`;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.visibility = "visible";
    if (document.fonts.status === "loaded") {
      container.setAttribute(FIT_STATUS_ATTRIBUTE, "ready");
    }
  });

  // Content size changes are caught by the ResizeObserver below.
  useLayoutEffect(() => {
    fit();
  }, [box.left, box.top, box.width, box.height, size, position.x, position.y]);

  useLayoutEffect(() => {
    // Re-fit when the content's own size changes, e.g. when a web font loads.
    const observer = new ResizeObserver(() => fit());
    if (contentRef.current) observer.observe(contentRef.current);

    // The fit is only marked ready once fonts are loaded.
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) fit();
    });
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      // Set to "ready" by `fit`.
      {...{ [FIT_STATUS_ATTRIBUTE]: "pending" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <div
        ref={scalerRef}
        // Geometry (left, top, transform) is set by `fit`. Hidden until then: the server-rendered
        // page shows the banner before its JavaScript runs, and unfitted content would jump into
        // place.
        {...{ [BANNER_CONTENT_ATTRIBUTE]: "" }}
        style={{
          position: "absolute",
          visibility: "hidden",
          transformOrigin: "0 0",
          width: "max-content",
        }}
      >
        <div ref={contentRef} style={{ width: "max-content" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
