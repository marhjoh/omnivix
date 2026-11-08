import { useId } from "react";
import { ClipboardPaste } from "lucide-react";
import { decodeAiUsage, usageStart, type AiUsage } from "@/src/banner/aiUsage";
import { FieldLabel } from "@/src/ui/FieldLabel";

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/** "Oct 5 – Nov 8, 2026": the first day with usage to the last day of the paste. */
function usageRange({ end, levels }: AiUsage): string {
  const first = Date.parse(usageStart(end)) + levels.search(/[1-4]/) * 86_400_000;
  return DATE.formatRange(first, Date.parse(end));
}

/** The AI usage in the sidebar, like UsernameField. Opens the usage dialog. */
export function UsageField({
  label,
  value,
  onOpen,
}: {
  label: string;
  value: string;
  onOpen: () => void;
}) {
  const labelId = useId();
  const valueId = useId();
  const usage = decodeAiUsage(value);
  return (
    <div className="space-y-1.5">
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <button
        type="button"
        onClick={onOpen}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        className="field-select flex items-center gap-2 text-left"
      >
        <ClipboardPaste className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        {usage ? (
          <span id={valueId} className="min-w-0 flex-1 truncate">
            {usageRange(usage)}
          </span>
        ) : (
          // Muted, like an empty field's placeholder.
          <span id={valueId} className="min-w-0 flex-1 truncate text-muted">
            Add usage
          </span>
        )}
      </button>
    </div>
  );
}
