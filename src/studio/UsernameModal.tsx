"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
              <Image
                src="/brand/icon.svg"
                alt=""
                width={40}
                height={40}
                className="mx-auto mb-4 h-10 w-10"
              />
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

              <p className="mb-6 text-xs text-muted/80">
                💡 Tip: Turn on{" "}
                <a
                  href="https://github.com/settings/profile#:~:text=Include%20private%20contributions%20on%20my%20profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors hover:text-text"
                >
                  &quot;Include private contributions on my profile&quot;
                </a>
                {" "}&mdash;{" "}
                <a
                  href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/showing-your-private-contributions-and-achievements-on-your-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors hover:text-text"
                >
                  learn why
                </a>
              </p>

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
