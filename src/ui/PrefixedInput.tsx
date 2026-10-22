import { useId, useImperativeHandle, useRef, type InputHTMLAttributes, type Ref } from "react";
import { X } from "lucide-react";

/**
 * A text field with fixed text in front (https://, https://github.com/) and a × that clears it and
 * keeps focus in the field. Prefix, field and × share one frame, which shows the focus ring while
 * the field has focus (`.field-input:focus-within`).
 */
export function PrefixedInput({
  prefix,
  clearLabel,
  onClear,
  ref,
  value,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "value" | "className"> & {
  prefix: string;
  /** The × button's name for screen readers, e.g. "Clear username". */
  clearLabel: string;
  onClear: () => void;
  ref?: Ref<HTMLInputElement>;
  value: string;
}) {
  const prefixId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  return (
    <div className="field-input flex items-center py-0 pr-1">
      <span id={prefixId} className="text-muted select-none">
        {prefix}
      </span>
      <input
        type="text"
        spellCheck={false}
        {...inputProps}
        ref={inputRef}
        aria-describedby={prefixId}
        className="min-w-0 flex-1 bg-transparent py-[9px] outline-none"
        value={value}
      />
      {value ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          className="btn-ghost h-8 w-8 shrink-0 p-0"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
