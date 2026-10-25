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
  return (
    <div className="space-y-1.5">
      <FieldLabel>GitHub username</FieldLabel>
      <button
        type="button"
        onClick={onChangeUsername}
        aria-label={username ? `Change GitHub username (@${username})` : "Choose GitHub username"}
        className="field-select flex items-center gap-2 text-left"
      >
        <User className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        {username ? (
          <span className="min-w-0 flex-1 truncate">@{username}</span>
        ) : (
          // Accent color: choosing a username is the next step.
          <span className="min-w-0 flex-1 truncate font-medium text-accent">Choose username</span>
        )}
      </button>
    </div>
  );
}
