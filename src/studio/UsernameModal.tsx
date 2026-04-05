"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { ThemedIcon } from "@/src/theme/ThemedBrand";

const externalActionClass =
  "group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs font-medium shadow-sm transition-[border-color,background-color,box-shadow,color] hover:border-accent hover:bg-accent/10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,129,247,0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

const STORAGE_KEY = "omnivix:github-username";

export function getStoredUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function storeUsername(username: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, username);
}

export function UsernameModal({
  open,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onSubmit: (username: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      storeUsername(trimmed);
      onSubmit(trimmed);
    }
  }

  function parseInput(raw: string): string {
    if (raw.includes("github.com/")) {
      return raw.split("github.com/").pop()?.split("/")[0]?.split("?")[0] ?? raw;
    }
    return raw;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-8"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6 text-center">
              <ThemedIcon className="mx-auto mb-4 h-10 w-10" size={40} />
              <h2 className="mb-1 text-lg font-bold">What&apos;s your GitHub username?</h2>
              <p className="text-sm text-muted">
                We&apos;ll use your <strong className="text-text">public data</strong> to personalize your banner.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3 flex items-center rounded-md border border-border bg-surface-2 px-3">
                <span className="select-none text-sm text-muted">https://github.com/</span>
                <input
                  type="text"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-text outline-none"
                  value={value}
                  onChange={(e) => setValue(parseInput(e.target.value))}
                  autoFocus
                />
              </div>

              <div className="mb-6 text-xs">
                <p className="text-center text-muted/80">
                  💡 Tip: turn on private contributions to get a more complete banner.
                </p>

                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <a
                    href="https://github.com/settings/profile#:~:text=Include%20private%20contributions%20on%20my%20profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${externalActionClass} text-text`}
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    GitHub settings
                  </a>

                  <a
                    href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/showing-your-private-contributions-and-achievements-on-your-profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${externalActionClass} text-muted hover:text-text`}
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    GitHub docs
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="btn-primary w-full justify-center py-3"
                  disabled={!value.trim()}
                >
                  Select Profile
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary w-full justify-center py-3">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
