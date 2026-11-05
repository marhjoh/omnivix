import { useRef, useState, type FocusEvent } from "react";
import { useDismiss } from "@/src/ui/useDismiss";

/**
 * Open/close for a disclosure panel, such as the export options: it closes on Escape (focus goes back to
 * the toggle), on a press outside the root, and when focus moves out of it (Tab past the last
 * option). Put `rootRef` and `onBlur` on the element holding both the toggle and the panel.
 * `close` is for an action in the panel that closes it: focus goes back to the toggle, like Escape,
 * instead of to the page start.
 */
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };
  useDismiss({
    open,
    isInside: (target) => rootRef.current?.contains(target) ?? false,
    onDismiss: (reason) => (reason === "escape" ? close() : setOpen(false)),
  });
  // No relatedTarget (a press on nothing focusable) is left to useDismiss.
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };
  return { open, setOpen, close, rootRef, toggleRef, onBlur };
}
