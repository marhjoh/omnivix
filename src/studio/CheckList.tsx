import type { ReactNode } from "react";
import { Check } from "lucide-react";
import controls from "@/src/studio/controls.module.css";

/** One frame of CheckRows (Show, Repositories). */
export function CheckList({
  scroll = false,
  busy,
  children,
}: {
  /** A fixed height that scrolls, so loading or a long list doesn't move what's below. */
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

/** A row in a CheckList: the name on the left, a check on the right; the whole row toggles. */
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

/** A placeholder row while a CheckList loads: a bar as wide as `width` for the name, a check. */
export function CheckRowSkeleton({ width }: { width: string }) {
  return (
    <div className={`${controls.checkRow} pointer-events-none`} aria-hidden>
      <span className="h-2.5 rounded bg-border/70 motion-safe:animate-pulse" style={{ width }} />
      <span className="h-4 w-4 shrink-0 rounded-[0.3rem] bg-border/70 motion-safe:animate-pulse" />
    </div>
  );
}
