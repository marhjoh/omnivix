import type { ReactNode } from "react";
import { Check } from "lucide-react";
import controls from "@/src/studio/controls.module.css";

/** The framed list that holds CheckRows, e.g. Show and Repositories. */
export function CheckList({
  scroll = false,
  busy,
  children,
}: {
  /** Fixed height that scrolls, so loading or a long list doesn't push down what's below. */
  scroll?: boolean;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={scroll ? `${controls.checkList} ${controls.checkListScroll}` : controls.checkList}
      aria-busy={busy}
    >
      {children}
    </div>
  );
}

/** A CheckList row. The whole row toggles, not just the check. */
export function CheckRow({
  label,
  on,
  disabled = false,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={controls.checkRow}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={controls.check} aria-hidden>
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  );
}

/** Placeholder row while a CheckList loads. `width` sets the width of the name bar. */
export function CheckRowSkeleton({ width }: { width: string }) {
  return (
    <div className={`${controls.checkRow} pointer-events-none`} aria-hidden>
      <span className="h-2.5 rounded bg-border/70 motion-safe:animate-pulse" style={{ width }} />
      <span className="h-4 w-4 shrink-0 rounded-[0.3rem] bg-border/70 motion-safe:animate-pulse" />
    </div>
  );
}
