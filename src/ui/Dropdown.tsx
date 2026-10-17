"use client";

import { KeyboardEvent, PropsWithChildren, ReactNode, useEffect, useId, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

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

    const onDoc = (e: MouseEvent) => {
      const root = (e.target as Element | null)?.closest(`[${ROOT_ATTRIBUTE}]`);
      if (root?.getAttribute(ROOT_ATTRIBUTE) !== listId) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Only close the list, not whatever contains it (the phone settings drawer).
      e.stopPropagation();
      setOpen(false);
      document.getElementById(triggerId)?.focus();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, listId, triggerId]);

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
  children,
}: PropsWithChildren<{
  dropdown: Dropdown;
  disabled?: boolean;
}>) {
  const { open, setOpen, listId, triggerId } = dropdown;
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      id={triggerId}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-[9px] text-left text-sm text-text transition-colors focus:outline-hidden focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Chevron className="h-4 w-4 shrink-0 self-center opacity-60" aria-hidden />
    </button>
  );
}

export function DropdownList({
  dropdown,
  label,
  className = "right-0 left-0",
  children,
}: PropsWithChildren<{
  dropdown: Dropdown;
  label: string;
  /** Horizontal placement; by default the list is as wide as its root. */
  className?: string;
}>) {
  const { open, listId, onListKeyDown } = dropdown;
  if (!open) return null;
  return (
    <div
      id={listId}
      role="listbox"
      aria-label={label}
      onKeyDown={onListKeyDown}
      className={`absolute top-full z-50 mt-1 max-h-64 ${className} overflow-y-auto rounded-lg border border-border bg-surface-2 py-1 shadow-lg`}
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
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface focus:bg-surface focus:outline-hidden"
      onClick={onSelect}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : (
        (icon ?? <span className="w-3.5 shrink-0" />)
      )}
      {children}
    </button>
  );
}

export function DropdownGroupLabel({ children }: PropsWithChildren) {
  return (
    <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
      {children}
    </div>
  );
}

/** Replaces a native `<select>`, styled and behaving like the background picker. */
export function Select({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  /** Accessible name for the option list. */
  label: string;
  value: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const dropdown = useDropdown(id);
  const current = options.find((option) => option.value === value);
  return (
    <DropdownRoot dropdown={dropdown} className="relative">
      <DropdownTrigger dropdown={dropdown} disabled={disabled}>
        {current?.label ?? value}
      </DropdownTrigger>
      <DropdownList dropdown={dropdown} label={`${label} options`}>
        {options.map((option) => (
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
  );
}
