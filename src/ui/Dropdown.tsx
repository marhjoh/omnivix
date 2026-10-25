"use client";

import { KeyboardEvent, PropsWithChildren, ReactNode, useEffect, useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FieldLabel } from "@/src/ui/FieldLabel";
import { useDismiss } from "@/src/ui/useDismiss";

const ROOT_ATTRIBUTE = "data-dropdown";

function optionsIn(listId: string): HTMLElement[] {
  const list = document.getElementById(listId);
  return list ? Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')) : [];
}

/**
 * Open state, focus handling and keyboard support for a button-triggered listbox. The selected (or
 * first) option gets focus on open; choosing an option or pressing Escape closes the list and
 * returns focus to the trigger, while Tab and outside clicks close it and leave focus where it went.
 * Elements are found by id, so nothing here is a ref.
 */
export function useDropdown(triggerId: string) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const options = optionsIn(listId);
    const selected =
      options.find((el) => el.getAttribute("aria-selected") === "true") ?? options[0];
    requestAnimationFrame(() => selected?.focus());
  }, [open, listId]);

  useDismiss({
    open,
    isInside: (target) =>
      target.closest(`[${ROOT_ATTRIBUTE}]`)?.getAttribute(ROOT_ATTRIBUTE) === listId,
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

type Dropdown = ReturnType<typeof useDropdown>;

/** The down arrow on a button that opens a list or panel; it turns over while that's open. */
export function DropdownChevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <ChevronDown
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""} ${className}`}
      aria-hidden
    />
  );
}

/** Wraps trigger and list; clicks inside it don't count as outside clicks. */
export function DropdownRoot({
  dropdown,
  className,
  children,
}: PropsWithChildren<{ dropdown: Dropdown; className?: string }>) {
  return (
    <div {...{ [ROOT_ATTRIBUTE]: dropdown.listId }} className={className}>
      {children}
    </div>
  );
}

export function DropdownTrigger({
  dropdown,
  disabled,
  joinedBelow = false,
  children,
}: PropsWithChildren<{
  dropdown: Dropdown;
  disabled?: boolean;
  /** Something is attached under the trigger (see BackgroundImagePicker), so its bottom is square. */
  joinedBelow?: boolean;
}>) {
  const { open, setOpen, listId, triggerId } = dropdown;
  return (
    <button
      type="button"
      id={triggerId}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      className={`field-select flex items-center justify-between gap-2 text-left ${
        joinedBelow ? "rounded-b-none" : ""
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <DropdownChevron open={open} className="self-center text-muted" />
    </button>
  );
}

export function DropdownList({
  dropdown,
  label,
  floating = false,
  children,
}: PropsWithChildren<{
  dropdown: Dropdown;
  label: string;
  /**
   * Floats below a frameless button (the studio's template picker), as wide as its options.
   * Otherwise the list is attached under its DropdownTrigger, like the native selects' lists.
   */
  floating?: boolean;
}>) {
  const { open, listId, onListKeyDown } = dropdown;
  if (!open) return null;
  // The frame is .popover (app/globals.css); an attached list takes the trigger's border color.
  const placement = floating
    ? "left-0 mt-1.5 w-max rounded-lg"
    : "right-0 left-0 -mt-px rounded-b-lg border-(--control-border)";
  return (
    <div
      id={listId}
      role="listbox"
      aria-label={label}
      onKeyDown={onListKeyDown}
      className={`popover absolute top-full z-50 max-h-72 overflow-y-auto p-1 ${placement}`}
    >
      {children}
    </div>
  );
}

/** One option: a check mark when selected, otherwise `icon` or an empty slot of the same width. */
export function DropdownOption({
  selected,
  icon,
  onSelect,
  children,
}: PropsWithChildren<{ selected: boolean; icon?: ReactNode; onSelect: () => void }>) {
  return (
    <button
      type="button"
      role="option"
      tabIndex={-1}
      aria-selected={selected}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-sm font-medium text-text hover:bg-surface-2 focus:bg-surface-2 focus:outline-hidden"
      onClick={onSelect}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-accent-hover" />
      ) : (
        (icon ?? <span className="w-3.5 shrink-0" />)
      )}
      {children}
    </button>
  );
}

export function DropdownGroupLabel({ children }: PropsWithChildren) {
  return <div className="px-2.5 pt-2 pb-1 text-sm font-semibold text-text">{children}</div>;
}

/**
 * A setting's dropdown with its label: the same list as the Background picker, so every dropdown
 * looks and opens the same on every browser and phone.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const dropdown = useDropdown(id);
  // A value that isn't among the options (a saved year older than the list) is shown as is, and
  // listed first so it stays selected.
  const shown = options.some((option) => option.value === value)
    ? options
    : [{ label: value, value }, ...options];
  const current = shown.find((option) => option.value === value);
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DropdownRoot dropdown={dropdown} className="relative">
        <DropdownTrigger dropdown={dropdown} disabled={disabled}>
          {current?.label}
        </DropdownTrigger>
        <DropdownList dropdown={dropdown} label={`${label} options`}>
          {shown.map((option) => (
            <DropdownOption
              key={option.value}
              selected={option.value === value}
              onSelect={() => {
                onChange(option.value);
                dropdown.close();
              }}
            >
              {option.label}
            </DropdownOption>
          ))}
        </DropdownList>
      </DropdownRoot>
    </div>
  );
}
