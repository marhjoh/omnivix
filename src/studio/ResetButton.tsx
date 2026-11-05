import { RotateCcw } from "lucide-react";
import controls from "@/src/studio/controls.module.css";

/** Reset button at the end of a setting's label row, for changes made in the preview. */
export function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        // The button disappears after the reset, so move focus to the setting, not the page start.
        const setting = event.currentTarget.parentElement?.querySelector("label")?.control;
        onClick();
        setting?.focus();
      }}
      className={controls.reset}
    >
      <RotateCcw className="h-3 w-3" aria-hidden />
      Reset
    </button>
  );
}
