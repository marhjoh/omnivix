import { useRef, useState, type FocusEvent } from "react";
import { useDismiss } from "@/src/ui/useDismiss";

/**
 * Open/close for a disclosure panel (the export options): it closes on Escape (focus goes back to
 * the toggle), on a press outside the root, and when focus moves out of it (Tab past the last
 * option). Put `rootRef` and `onBlur` on the element holding both the toggle and the panel.
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useDismiss({
    open,
    isInside: (target) => rootRef.current?.contains(target) ?? false,
    onDismiss: (reason) => {
      setOpen(false);
      if (reason === "escape") toggleRef.current?.focus();
    },
  });
  // No relatedTarget (a press on nothing focusable) is left to useDismiss.
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };
  return { open, setOpen, rootRef, toggleRef, onBlur };
}
