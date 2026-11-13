"use client";

import { useRef, useState } from "react";
import { FEED_LINK_MAX_LENGTH, feedLinkFrom } from "@/src/banner/feed";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { Dialog } from "@/src/ui/Dialog";
import { PrefixedInput } from "@/src/ui/PrefixedInput";

/** The field shows `https://` in front, so a pasted link loses its own. */
function withoutScheme(link: string): string {
  return link.replace(/^\s*https?:\/\//i, "");
}

/**
 * Asks for a feed link, like UsernameModal asks for a username. A profile link on dev.to, Medium,
 * Hashnode or Substack is saved as its feed link.
 */
export function FeedModal({
  open,
  currentFeed,
  onSubmit,
  onCancel,
  onError,
}: {
  open: boolean;
  /** Prefills the field each time the dialog opens. */
  currentFeed: string;
  onSubmit: (feed: string) => void;
  onCancel: () => void;
  /** Shows a link it can't use in a toast. */
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState(() => withoutScheme(currentFeed));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(withoutScheme(currentFeed));
  }
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = feedLinkFrom(`https://${draft.trim()}`);
    if (result.ok) onSubmit(result.link);
    else onError(result.message);
  }

  return (
    <Dialog open={open} onCancel={onCancel} labelledBy="feed-modal-title" initialFocus={inputRef}>
      <div className="mb-6 text-center">
        <ThemedIcon className="mx-auto mb-4 h-10 w-10" size={40} />
        <h2 id="feed-modal-title" className="mb-1 text-lg font-bold">
          Add your feed
        </h2>
        <p className="text-sm text-balance text-muted">
          We&apos;ll show the newest posts from your{" "}
          <strong className="text-text">blog&apos;s feed</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <PrefixedInput
            ref={inputRef}
            prefix="https://"
            inputMode="url"
            autoComplete="url"
            maxLength={FEED_LINK_MAX_LENGTH}
            placeholder="blog.com/rss.xml"
            aria-label="Feed link"
            value={draft}
            onChange={(e) => setDraft(withoutScheme(e.target.value))}
            clearLabel="Clear feed link"
            onClear={() => setDraft("")}
          />
        </div>

        <p className="mb-6 text-center text-xs text-muted">
          <strong className="font-semibold text-text">Tip:</strong> a dev.to, Medium, Hashnode or
          Substack profile link works too.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="btn-primary h-10 w-full justify-center py-0"
            disabled={!draft.trim()}
          >
            Use feed
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
