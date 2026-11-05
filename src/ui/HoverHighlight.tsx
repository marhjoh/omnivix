"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";

type GroupState = {
  active: string | null;
  setActive: (id: string | null) => void;
  layoutId: string;
};
const GroupContext = createContext<GroupState | null>(null);

/**
 * A row of items sharing one highlight that slides to whichever item is hovered or focused. Style
 * the items with the classes in ./classNames.
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
  const group = useMemo(() => ({ active, setActive, layoutId }), [active, layoutId]);
  return (
    <GroupContext.Provider value={group}>
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
  shrink = false,
  children,
}: {
  id: string;
  /** Lets the item shrink when the row runs out of room. Its content should truncate. */
  shrink?: boolean;
  children: ReactNode;
}) {
  const { active, setActive, layoutId } = useContext(GroupContext)!;
  return (
    <div
      className={`relative ${shrink ? "min-w-0" : "shrink-0"}`}
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
