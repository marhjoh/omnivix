"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

/** How long a toast stays before it fades out by itself. */
const TOAST_DURATION_MS = 6000;

export interface ToastMessage {
  /** Changes for every toast, so the same message shown twice restarts the timer. */
  id: number;
  message: string;
}

/**
 * Error toast at the bottom of the screen, for one-off problems (an upload that was rejected, an
 * export that failed). It fades after a few seconds or when dismissed.
 */
export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex max-w-[min(24rem,100%)] items-start gap-2 rounded-lg border border-danger/40 bg-surface px-3 py-2.5 text-sm leading-snug text-text shadow-lg"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            <span className="min-w-0">{toast.message}</span>
            <button
              type="button"
              onClick={onDismiss}
              className="btn-ghost -mr-1 shrink-0 rounded p-0.5"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
