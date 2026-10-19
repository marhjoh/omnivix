import type { ReactNode } from "react";
import landingStyles from "@/src/landing/landing.module.css";

/** A section's big headline, in the brand gradient (wipes in on scroll, see landing.module.css). */
export function SectionHeading({
  id,
  children,
  className = "mb-10 md:mb-14",
}: {
  id: string;
  children: ReactNode;
  /** Space below; tighter when a caption follows. */
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`${landingStyles.gradientText} ${landingStyles.sectionHeading} ${className}`}
    >
      {children}
    </h2>
  );
}
