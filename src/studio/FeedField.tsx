import { useId } from "react";
import { Rss } from "lucide-react";
import { FieldLabel } from "@/src/ui/FieldLabel";

/** The feed link without `https://`, like "dev.to/feed/ada". */
function shortLink(link: string): string {
  return link.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** The feed in the sidebar, like UsageField. Opens the feed dialog. */
export function FeedField({
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
        <Rss className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        {value ? (
          <span id={valueId} className="min-w-0 flex-1 truncate">
            {shortLink(value)}
          </span>
        ) : (
          // Muted, like an empty field's placeholder.
          <span id={valueId} className="min-w-0 flex-1 truncate text-muted">
            Add feed
          </span>
        )}
      </button>
    </div>
  );
}
