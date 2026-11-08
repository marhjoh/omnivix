import type { TechIcon } from "@/src/icons/iconSelection";

/** A Simple Icons logo in one color. */
export function IconMark({
  icon,
  size,
  color = "currentColor",
}: {
  icon: Pick<TechIcon, "path">;
  size: number;
  color?: string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ flexShrink: 0 }}
    >
      <path d={icon.path} />
    </svg>
  );
}
