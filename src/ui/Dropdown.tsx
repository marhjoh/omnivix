"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useId,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { FieldWrapper, fieldLabelId } from "@/src/ui/FieldLabel";
import { Spinner } from "@/src/ui/Spinner";
import { type Dropdown, DROPDOWN_ROOT_ATTRIBUTE, useDropdown } from "@/src/ui/useDropdown";

/**
 * The down arrow on a button that opens a list or panel; it turns over while that's open. While
 * `busy` (something the button started is still running), a spinner takes its place.
 */
export function DropdownChevron({
  open,
  busy = false,
  className = "",
}: {
  open: boolean;
  busy?: boolean;
  className?: string;
}) {
  if (busy) return <Spinner className={className} />;
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
    <div {...{ [DROPDOWN_ROOT_ATTRIBUTE]: dropdown.listId }} className={className}>
      {children}
    </div>
  );
}

/**
 * A setting's field: its value and a chevron, opening a list or panel. It's named by its
 * FieldLabel and then its value, so screen readers read both: "Alignment, Center".
 */
export function FieldButton({
  id,
  open,
  busy = false,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { id: string; open: boolean; busy?: boolean }) {
  return (
    <button
      type="button"
      id={id}
      aria-labelledby={`${fieldLabelId(id)} ${id}-value`}
      aria-expanded={open}
      aria-busy={busy}
      className={`field-select flex items-center justify-between gap-2 text-left ${className}`}
      {...props}
    >
      <span id={`${id}-value`} className="min-w-0 flex-1 truncate">
        {children}
      </span>
      <DropdownChevron open={open} busy={busy} className="self-center text-muted" />
    </button>
  );
}

export function DropdownTrigger({
  dropdown,
  disabled,
  joinedBelow = false,
  busy,
  children,
}: PropsWithChildren<{
  dropdown: Dropdown;
  disabled?: boolean;
  /** Something is attached under the trigger (see ImagePicker), so its bottom is square. */
  joinedBelow?: boolean;
  /** The choice is still being applied (an upload being processed); a spinner replaces the chevron. */
  busy?: boolean;
}>) {
  const { open, setOpen, listId, triggerId } = dropdown;
  return (
    <FieldButton
      id={triggerId}
      open={open}
      busy={busy}
      aria-haspopup="listbox"
      aria-controls={open ? listId : undefined}
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      className={joinedBelow ? "rounded-b-none" : ""}
    >
      {children}
    </FieldButton>
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
  // The frame is .popover, and .popover-attached joins it to the trigger (app/globals.css).
  const placement = floating
    ? "absolute top-full left-0 z-50 mt-1.5 w-max rounded-lg"
    : "popover-attached";
  return (
    <div
      id={listId}
      role="listbox"
      aria-label={label}
      onKeyDown={onListKeyDown}
      className={`popover max-h-72 overflow-y-auto p-1 ${placement}`}
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
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-sm font-medium text-text transition-colors duration-(--hover-fade) hover:bg-surface-2 focus:bg-surface-2 focus:outline-hidden"
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
 * An option's name, after its `preview` if it has one. Previews (a color, a quote mark) share one
 * width, so the names after them line up from field to field.
 */
export function OptionLabel({
  label,
  style,
  preview,
}: {
  label: ReactNode;
  style?: CSSProperties;
  preview?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {preview === undefined ? null : (
        <span aria-hidden className="flex w-8 shrink-0 items-center">
          {preview}
        </span>
      )}
      <span style={style} className="truncate">
        {label}
      </span>
    </span>
  );
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
  placeholder,
  labelAction,
}: {
  label: string;
  value: string;
  /**
   * `style` shows an option in its own look, such as a font in its typeface; `preview` is a small
   * sample before its name; an empty one keeps the names lined up.
   */
  options: ReadonlyArray<{
    label: string;
    value: string;
    style?: CSSProperties;
    preview?: ReactNode;
  }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Shown when the value is none of the options, with none of them selected. */
  placeholder?: string;
  /** A small action at the end of the label row, such as Reset. */
  labelAction?: ReactNode;
}) {
  const id = useId();
  const dropdown = useDropdown(id);
  // Without a placeholder, a value that isn't among the options (a saved year older than the
  // list) is shown as is, and listed first so it stays selected.
  const shown =
    placeholder !== undefined || options.some((option) => option.value === value)
      ? options
      : [{ label: value, value }, ...options];
  const current = shown.find((option) => option.value === value);
  return (
    <FieldWrapper label={label} htmlFor={id} end={labelAction}>
      <DropdownRoot dropdown={dropdown} className="relative">
        <DropdownTrigger dropdown={dropdown} disabled={disabled}>
          {current ? <OptionLabel {...current} /> : placeholder}
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
              <OptionLabel {...option} />
            </DropdownOption>
          ))}
        </DropdownList>
      </DropdownRoot>
    </FieldWrapper>
  );
}
