"use client";

import { PropsWithChildren, useEffectEvent, useLayoutEffect, useRef } from "react";
import { CONTENT_SIZE_FACTOR, type ContentSize } from "@/src/banner/contentSize";
import type { Position } from "@/src/banner/position";
import { FIT_STATUS_ATTRIBUTE, fitScale } from "@/src/banner/fit";
import { BANNER_CONTENT_ATTRIBUTE } from "@/src/banner/placement";
import type { Rect } from "@/src/lib/sizes";

/**
 * Scales its content to fit the padded box (`contentBox`) and places it at `position`. `xl` is the
 * largest scale that fits, and smaller sizes are fractions of it (see contentSize.ts).
 *
 * The scale is a CSS transform so text and SVG stay sharp. It's set on the DOM after layout instead
 * of in state, because it only depends on measured sizes.
 */
export function FitContent({
  children,
  box,
  size,
  position,
}: PropsWithChildren<{ box: Rect; size: ContentSize; position: Position }>) {
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
    scaler.style.opacity = "1";
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

    // Fit again once fonts load. Only a fit with fonts loaded sets "ready".
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
        // `fit` sets left, top and transform, then shows the content. Until then it's hidden: the
        // server-rendered banner shows before JavaScript runs, and the content would jump into
        // place. The studio fades the opacity in (studio.module.css).
        {...{ [BANNER_CONTENT_ATTRIBUTE]: "" }}
        style={{
          position: "absolute",
          visibility: "hidden",
          opacity: 0,
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
