import { Loader2 } from "lucide-react";

/**
 * A busy indicator that takes an icon's place. It doesn't spin with reduced motion. Screen readers
 * skip it unless it has a `label`, because the button around it already reports busy.
 */
export function Spinner({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <Loader2
      className={`h-4 w-4 shrink-0 motion-safe:animate-spin ${className}`}
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
