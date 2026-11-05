import type { ReactNode } from "react";
import { LabeledGroup } from "@/src/ui/FieldLabel";
import controls from "@/src/studio/controls.module.css";

interface TileOption<T> {
  value: T;
  disabled?: boolean;
}

/**
 * A single choice shown as a labeled group of tiles (.tile in controls.module.css). Each tile is an
 * aria-pressed button that renders `children(option)`. `columns` sets an even grid. Without it,
 * `tilesClassName` handles the layout, as in the preview's view toggle.
 */
export function TileGroup<T extends string | number, O extends TileOption<T>>({
  label,
  options,
  value,
  onChange,
  columns,
  tileClassName,
  className,
  labelClassName,
  tilesClassName = "grid gap-2",
  children,
}: {
  label: string;
  options: readonly O[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
  /** The tiles' own look, such as controls.colorTile. */
  tileClassName: string;
  /** The group's and its label's classes, when they differ from a sidebar setting's. */
  className?: string;
  labelClassName?: string;
  tilesClassName?: string;
  children: (option: O) => ReactNode;
}) {
  return (
    <LabeledGroup label={label} className={className} labelClassName={labelClassName}>
      <div
        className={tilesClassName}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`${controls.tile} ${tileClassName}`}
            // Lets CSS style one specific tile, such as the Appearance tiles.
            data-value={option.value}
          >
            {children(option)}
          </button>
        ))}
      </div>
    </LabeledGroup>
  );
}
