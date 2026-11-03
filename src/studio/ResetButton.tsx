import { RotateCcw } from "lucide-react";
import controls from "@/src/studio/controls.module.css";

/** A setting's Reset, at the end of its label row, for what was changed in the preview. */
export function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        // The button goes once the setting is reset: focus the setting, not the page start.
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
