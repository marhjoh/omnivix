"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A modal dialog: Escape and clicks outside it cancel, Tab stays inside it, and focus goes back to
 * where it was when it closes. `initialFocus` gets the focus, with the cursor at the end.
 */
export function Dialog({
  open,
  onCancel,
  labelledBy,
  initialFocus,
  children,
}: {
  open: boolean;
  onCancel: () => void;
  /** The id of the dialog's heading. */
  labelledBy: string;
  initialFocus: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Read this before focusing the field. autoFocus would run first and lose it.
    const returnFocusTo = document.activeElement as HTMLElement | null;
    const field = initialFocus.current;
    field?.focus();
    field?.setSelectionRange(field.value.length, field.value.length);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])",
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
  }, [open, onCancel, initialFocus]);

  return (
    // Skip the fade when the dialog is open on load (a first visit). It then shows with the first
    // paint instead of waiting for JavaScript. Opening it later still fades in.
    <AnimatePresence initial={false}>
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
              aria-labelledby={labelledBy}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
