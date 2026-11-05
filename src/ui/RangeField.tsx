import type { ReactNode } from "react";
import { FieldValue, FieldWrapper } from "@/src/ui/FieldLabel";

/**
 * A slider with its label. `valueText` is the value as it reads (Zoom's "120%"): it shows at the
 * end of the label row and is what screen readers say instead of the bare number.
 */
export function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  valueText,
  onChange,
}: {
  id: string;
  label: ReactNode;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  valueText?: string;
  onChange: (value: number) => void;
}) {
  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      end={valueText === undefined ? undefined : <FieldValue>{valueText}</FieldValue>}
    >
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </FieldWrapper>
  );
}
