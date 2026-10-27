import { useId } from "react";
import { User } from "lucide-react";
import { FieldLabel } from "@/src/ui/FieldLabel";

/** The GitHub username in the sidebar's Profile section; opens the username dialog. */
export function UsernameField({
  username,
  onChangeUsername,
}: {
  username: string;
  onChangeUsername: () => void;
}) {
  const labelId = useId();
  const valueId = useId();
  return (
    <div className="space-y-1.5">
      <FieldLabel id={labelId}>GitHub username</FieldLabel>
      {/* Named "GitHub username @octocat", so the name contains the visible text. */}
      <button
        type="button"
        onClick={onChangeUsername}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        className="field-select flex items-center gap-2 text-left"
      >
        <User className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        {username ? (
          <span id={valueId} className="min-w-0 flex-1 truncate">
            @{username}
          </span>
        ) : (
          // Muted, like an empty field's placeholder.
          <span id={valueId} className="min-w-0 flex-1 truncate text-muted">
            Choose username
          </span>
        )}
      </button>
    </div>
  );
}
