import { useEffect, useEffectEvent } from "react";

type DismissReason = "outside" | "escape";

/**
 * While `open`, dismisses a popup on Escape or a press outside it. Escape doesn't propagate, so the
 * phone settings drawer around the popup stays open.
 */
export function useDismiss({
  open,
  isInside,
  onDismiss,
}: {
  open: boolean;
  isInside: (target: Element) => boolean;
  onDismiss: (reason: DismissReason) => void;
}) {
  const inside = useEffectEvent(isInside);
  const dismiss = useEffectEvent(onDismiss);
  useEffect(() => {
    if (!open) return;
    const onPress = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !inside(e.target)) dismiss("outside");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      dismiss("escape");
    };
    document.addEventListener("mousedown", onPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPress);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
}
