import type { ReactNode } from "react";

/** A section's big headline, in the brand gradient (wipes in on scroll, see app/globals.css). */
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
    <h2 id={id} className={`gradient-text section-heading ${className}`}>
      {children}
    </h2>
  );
}
