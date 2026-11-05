import { useRef, useState, type FocusEvent } from "react";
import { useDismiss } from "@/src/ui/useDismiss";

/**
 * Open state for a disclosure panel, such as the export options. It closes on Escape, on a press
 * outside the root, and when focus leaves it (Tab past the last option). Put `rootRef` and `onBlur`
 * on the element that holds both the toggle and the panel.
 *
 * Escape and `close` send focus back to the toggle. Call `close` from an action inside the panel,
 * or focus would jump to the start of the page.
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
  // A press on something that can't take focus has no relatedTarget. useDismiss handles that.
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };
  return { open, setOpen, close, rootRef, toggleRef, onBlur };
}
