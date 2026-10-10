"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";

type GroupState = {
  active: string | null;
  setActive: (id: string | null) => void;
  layoutId: string;
};
const GroupContext = createContext<GroupState | null>(null);

/**
 * A row of items sharing one highlight that slides to whichever item is hovered or focused.
 * Style the items with the classes in ./highlightClasses (a plain module, so server components can use them too).
 */
export function HoverHighlightGroup({
  layoutId,
  as: Element = "div",
  className,
  children,
  "aria-label": ariaLabel,
}: {
  /** Unique per group on the page. */
  layoutId: string;
  as?: "div" | "nav";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <GroupContext.Provider value={{ active, setActive, layoutId }}>
      <MotionConfig reducedMotion="user">
        <Element className={className} aria-label={ariaLabel} onMouseLeave={() => setActive(null)}>
          {children}
        </Element>
      </MotionConfig>
    </GroupContext.Provider>
  );
}

export function HoverHighlightItem({
  id,
  className = "",
  children,
}: {
  id: string;
  /** For spacing on the wrapper (margins here keep the highlight the size of the button). */
  className?: string;
  children: ReactNode;
}) {
  const group = useContext(GroupContext);
  if (!group) throw new Error("HoverHighlightItem must be inside a HoverHighlightGroup");
  const { active, setActive, layoutId } = group;
  return (
    <div
      className={`relative shrink-0 ${className}`}
      onMouseEnter={() => setActive(id)}
      onFocus={() => setActive(id)}
      onBlur={() => setActive(null)}
    >
      {active === id && (
        <motion.span
          layoutId={layoutId}
          className="pointer-events-none absolute inset-0 rounded-full bg-text/8"
          transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
        />
      )}
      {children}
    </div>
  );
}
