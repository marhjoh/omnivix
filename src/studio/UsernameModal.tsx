"use client";

import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usernameFromProfileLink } from "@/src/lib/githubUsername";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { PrefixedInput } from "@/src/ui/PrefixedInput";
import { Dialog } from "@/src/ui/Dialog";

/** The tip's links: secondary buttons, with the studio's faint blue hover. */
const externalActionClass = "btn-secondary h-9 px-3 py-0";

export function UsernameModal({
  open,
  currentUsername,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  /** Prefills the field each time the dialog opens. */
  currentUsername: string;
  onSubmit: (username: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentUsername);
  // Each time the dialog opens, the field starts from the current username.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue(currentUsername);
  }
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <Dialog
      open={open}
      onCancel={onCancel}
      labelledBy="username-modal-title"
      initialFocus={inputRef}
    >
      <div className="mb-6 text-center">
        <ThemedIcon className="mx-auto mb-4 h-10 w-10" size={40} />
        <h2 id="username-modal-title" className="mb-1 text-lg font-bold">
          What&apos;s your GitHub username?
        </h2>
        <p className="text-sm text-muted">
          We&apos;ll use your <strong className="text-text">public data</strong> to personalize your
          banner.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <PrefixedInput
            ref={inputRef}
            prefix="https://github.com/"
            placeholder="username"
            autoComplete="username"
            aria-labelledby="username-modal-title"
            value={value}
            onChange={(e) => setValue(usernameFromProfileLink(e.target.value))}
            clearLabel="Clear username"
            onClear={() => setValue("")}
          />
        </div>

        <div className="mb-6 text-xs">
          <p className="text-center text-muted">
            <strong className="font-semibold text-text">Tip:</strong> turn on private contributions
            to get a more complete banner.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <a
              href="https://github.com/settings/profile#:~:text=Include%20private%20contributions%20on%20my%20profile"
              target="_blank"
              rel="noopener noreferrer"
              className={externalActionClass}
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              GitHub settings
            </a>

            <a
              href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/showing-your-private-contributions-and-achievements-on-your-profile"
              target="_blank"
              rel="noopener noreferrer"
              className={externalActionClass}
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              GitHub docs
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="btn-primary h-10 w-full justify-center py-0"
            disabled={!value.trim()}
          >
            Use username
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary h-10 w-full justify-center py-0"
          >
            Cancel
          </button>
        </div>
      </form>
    </Dialog>
  );
}
