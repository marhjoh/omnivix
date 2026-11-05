import { type KeyboardEvent, useId, useLayoutEffect, useState } from "react";
import { useDismiss } from "@/src/ui/useDismiss";

/** Set on DropdownRoot to the list's id. Presses inside that element don't close the list. */
export const DROPDOWN_ROOT_ATTRIBUTE = "data-dropdown";

function optionsIn(listId: string): HTMLElement[] {
  const list = document.getElementById(listId);
  return list ? Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')) : [];
}

/**
 * Open state, focus and keyboard support for a listbox opened by a button. Opening focuses the
 * selected option, or the first one. Choosing an option or pressing Escape closes the list and
 * focuses the trigger. Tab and outside clicks close it and leave focus alone. Clicking the
 * trigger's label works like clicking the trigger.
 */
export function useDropdown(triggerId: string) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  };

  // Before the first paint, so a list opens already scrolled to its selected option.
  useLayoutEffect(() => {
    if (!open) return;
    const options = optionsIn(listId);
    const selected =
      options.find((el) => el.getAttribute("aria-selected") === "true") ?? options[0];
    selected?.focus();
  }, [open, listId]);

  useDismiss({
    open,
    // The label forwards its click to the trigger, which closes the list. If we closed it here as
    // well, that click would open it again.
    isInside: (target) =>
      target.closest(`[${DROPDOWN_ROOT_ATTRIBUTE}]`)?.getAttribute(DROPDOWN_ROOT_ATTRIBUTE) ===
        listId || target.closest("label")?.htmlFor === triggerId,
    onDismiss: (reason) => (reason === "escape" ? close() : setOpen(false)),
  });

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const options = optionsIn(listId);
    const current = options.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      e.preventDefault();
      options[index]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        focusAt(current < options.length - 1 ? current + 1 : 0);
        break;
      case "ArrowUp":
        focusAt(current > 0 ? current - 1 : options.length - 1);
        break;
      case "Home":
        focusAt(0);
        break;
      case "End":
        focusAt(options.length - 1);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return { open, setOpen, close, listId, triggerId, onListKeyDown };
}

export type Dropdown = ReturnType<typeof useDropdown>;
