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
  children,
}: {
  /** The control it labels; without it the label is plain text, named via `id`. */
  htmlFor?: string;
  id?: string;
  end?: ReactNode;
  children: ReactNode;
}) {
  const label = htmlFor ? (
    <label htmlFor={htmlFor} id={id ?? fieldLabelId(htmlFor)} className="field-label">
      {children}
    </label>
  ) : (
    <span id={id} className="field-label">
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

/** A group of controls named by its visible label, for screen readers too. */
export function LabeledGroup({
  label,
  end,
  children,
}: {
  label: string;
  end?: ReactNode;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="space-y-1.5">
      <FieldLabel id={labelId} end={end}>
        {label}
      </FieldLabel>
      {children}
    </div>
  );
}
