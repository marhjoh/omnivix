import { useId, type InputHTMLAttributes, type Ref } from "react";
import { X } from "lucide-react";

/**
 * A text field with fixed text in front (the background link's https://, the username's
 * https://github.com/) and a × that clears it. One frame for all three, so the focus ring shows
 * while the field inside has focus (`.field-input:focus-within`).
 */
export function PrefixedInput({
  prefix,
  clearLabel,
  onClear,
  ref,
  value,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "value"> & {
  prefix: string;
  /** The × button's name for screen readers, e.g. "Clear username". */
  clearLabel: string;
  onClear: () => void;
  ref?: Ref<HTMLInputElement>;
  value: string;
}) {
  const prefixId = useId();
  return (
    <div className="field-input flex items-center py-0 pr-1">
      <span id={prefixId} className="text-muted select-none">
        {prefix}
      </span>
      <input
        ref={ref}
        type="text"
        spellCheck={false}
        aria-describedby={prefixId}
        className="min-w-0 flex-1 bg-transparent py-[9px] outline-none"
        value={value}
        {...inputProps}
      />
      {value ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
          className="btn-ghost h-8 w-8 shrink-0 p-0"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
