import { useId, type ReactNode } from "react";

export function fieldLabelId(controlId: string): string {
  return `${controlId}-label`;
}

/**
 * A setting's label, shown above its control. `end` goes at the far end of the row, such as Zoom's
 * percentage, a count or a small action.
 */
export function FieldLabel({
  htmlFor,
  id,
  end,
  className = "field-label",
  children,
}: {
  /** The control it labels. Without it, the label is a plain span with `id`. */
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

/** A value at the end of a label row, like Zoom's percentage, in tabular digits. */
export function FieldValue({ children }: { children: ReactNode }) {
  return <span className="field-label tabular-nums">{children}</span>;
}

/**
 * A group of controls that screen readers announce by its visible label. Only a group outside the
 * sidebar, like the preview's view toggle, needs the class props.
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
