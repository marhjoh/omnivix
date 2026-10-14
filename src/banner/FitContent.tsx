"use client";

import { PropsWithChildren, useEffectEvent, useLayoutEffect, useRef } from "react";
import { FLEX_ALIGN, type ContentAlign } from "@/src/banner/contentAlign";
import { CONTENT_SIZE_FACTOR, type ContentSize } from "@/src/banner/contentSize";
import { contentBox, FIT_STATUS_ATTRIBUTE, fitScale } from "@/src/banner/fit";

/**
 * Scales content laid out at its natural size to fit the banner: `xl` is the largest scale that
 * fits the padded content area, smaller sizes are fractions of it (see `contentSize.ts`).
 *
 * The scale is a CSS transform, so text and SVG stay sharp. It is written to the DOM after layout
 * rather than kept in state, since it depends only on measured sizes.
 */
export function FitContent({
  children,
  size,
  align = "center",
}: PropsWithChildren<{ size: ContentSize; align?: ContentAlign }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fit = useEffectEvent(() => {
    const container = containerRef.current;
    const scaler = scalerRef.current;
    const content = contentRef.current;
    if (!container || !scaler || !content) return;

    const { inset, ...box } = contentBox({
      width: container.clientWidth,
      height: container.clientHeight,
    });
    if (box.width <= 0 || box.height <= 0) return;

    const natural = { width: content.offsetWidth, height: content.offsetHeight };
    const scale = fitScale(box, natural) * CONTENT_SIZE_FACTOR[size];
    scaler.style.width = `${box.width / scale}px`;
    scaler.style.height = `${box.height / scale}px`;
    scaler.style.left = `${inset}px`;
    scaler.style.top = `${inset}px`;
    scaler.style.transform = `scale(${scale})`;
    if (document.fonts.status === "loaded") {
      container.setAttribute(FIT_STATUS_ATTRIBUTE, "ready");
    }
  });

  // Content and banner size changes are caught by the ResizeObserver below.
  useLayoutEffect(() => {
    fit();
  }, [size, align]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => fit());
    if (containerRef.current) observer.observe(containerRef.current);
    // Also re-fit when the content's own size changes, e.g. when a web font loads.
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
        // Geometry (left, top, width, height, transform) is set by `fit`.
        style={{
          position: "absolute",
          transformOrigin: "0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: FLEX_ALIGN[align],
        }}
      >
        <div ref={contentRef} style={{ width: "max-content", flexShrink: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
