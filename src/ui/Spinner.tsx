import { Loader2 } from "lucide-react";

/**
 * A busy indicator in place of an icon; with reduced motion it shows without spinning. Hidden from
 * screen readers (the button around it says it's busy) unless it has a `label` of its own.
 */
export function Spinner({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <Loader2
      className={`h-4 w-4 shrink-0 motion-safe:animate-spin ${className}`}
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
