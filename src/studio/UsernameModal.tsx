"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { usernameFromProfileLink } from "@/src/lib/githubUsername";
import { ThemedIcon } from "@/src/theme/ThemedBrand";
import { PrefixedInput } from "@/src/ui/PrefixedInput";

/** The tip's links: secondary buttons, so hover is the faint blue border like the studio's. */
const externalActionClass = "btn-secondary h-9 px-3 py-0";

export function UsernameModal({
  open,
  currentUsername,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  /** Shown in the field when the dialog opens, so changing it starts from the current one. */
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // While open: Escape cancels, Tab stays inside the dialog, and focus goes back to where it was
  // (e.g. the username button) when it closes.
  useEffect(() => {
    if (!open) return;
    // Noted before focusing the input (not with autoFocus, which would run first).
    const returnFocusTo = document.activeElement as HTMLElement | null;
    const input = inputRef.current;
    input?.focus();
    // Cursor after the current username, ready to edit it.
    input?.setSelectionRange(input.value.length, input.value.length);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      returnFocusTo?.focus();
    };
  }, [open, onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <AnimatePresence>
      {open && (
        // Scrolls when the dialog is taller than the window (short phones, landscape).
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          {/* Clicks on the area around the dialog (not inside it) cancel, like the backdrop. */}
          <div
            className="relative flex min-h-full items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="username-modal-title"
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 text-center">
                <ThemedIcon className="mx-auto mb-4 h-10 w-10" size={40} />
                <h2 id="username-modal-title" className="mb-1 text-lg font-bold">
                  What&apos;s your GitHub username?
                </h2>
                <p className="text-sm text-muted">
                  We&apos;ll use your <strong className="text-text">public data</strong> to
                  personalize your banner.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <PrefixedInput
                    ref={inputRef}
                    prefix="https://github.com/"
                    autoComplete="username"
                    aria-labelledby="username-modal-title"
                    value={value}
                    onChange={(e) => setValue(usernameFromProfileLink(e.target.value))}
                    clearLabel="Clear username"
                    onClear={() => {
                      setValue("");
                      inputRef.current?.focus();
                    }}
                  />
                </div>

                <div className="mb-6 text-xs">
                  <p className="text-center text-muted/80">
                    <strong className="font-semibold text-text">Tip:</strong> turn on private
                    contributions to get a more complete banner.
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
