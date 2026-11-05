import { useId, type ReactNode } from "react";

/** The id of the FieldLabel for the control with this id. */
export function fieldLabelId(controlId: string): string {
  return `${controlId}-label`;
}

/**
 * A setting's label, above its control. `end` sits at the other end of the row: a value (Zoom's
 * percentage), a count or a small action.
 */
export function FieldLabel({
  htmlFor,
  id,
  end,
  className = "field-label",
  children,
}: {
  /** The control it labels; without it the label is plain text, named via `id`. */
  htmlFor?: string;
  id?: string;
  end?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const label = htmlFor ? (
    <label htmlFor={htmlFor} id={fieldLabelId(htmlFor)} className={className}>
      {children}
    </label>
  ) : (
    <span id={id} className={className}>
      {children}
    </span>
  );
  if (!end) return label;
  return (
    <div className="flex items-baseline justify-between gap-2">
      {label}
      {end}
    </div>
  );
}

/** A value at the end of a label row, such as Zoom's percentage or a count, in even digits. */
export function FieldValue({ children }: { children: ReactNode }) {
  return <span className="field-label tabular-nums">{children}</span>;
}

/**
 * A group of controls named by its visible label, for screen readers too. The classes are for a
 * group outside the sidebar (the preview's view toggle); the sidebar's groups keep the defaults.
 */
export function LabeledGroup({
  label,
  end,
  className = "space-y-1.5",
  labelClassName,
  children,
}: {
  label: string;
  end?: ReactNode;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className={className}>
      <FieldLabel id={labelId} end={end} className={labelClassName}>
        {label}
      </FieldLabel>
      {children}
    </div>
  );
}

/** A setting with its label above it, and `end` at the other end of the label row. */
export function FieldWrapper({
  label,
  htmlFor,
  end,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  end?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={htmlFor} end={end}>
        {label}
      </FieldLabel>
      {children}
    </div>
  );
}
