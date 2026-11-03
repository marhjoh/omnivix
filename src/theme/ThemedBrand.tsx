import Image, { type ImageProps } from "next/image";

/*
 * Both variants are rendered; CSS on <html data-theme> shows one (see globals.css). That way the
 * logo switches in the same frame as the colors, and is right before React hydrates.
 * The "light" artwork is the one drawn for dark backgrounds.
 */

/** Wordmark viewBox 968×274 — props must match that ratio for fixed height (h-9). */
const LOGO_WIDTH = Math.round((36 * 968) / 274);
const LOGO_HEIGHT = 36;

function ThemedImage({
  name,
  className,
  alt,
  ...props
}: { name: "logo" | "icon"; className: string } & Omit<ImageProps, "src">) {
  return (
    <>
      {(["dark", "light"] as const).map((theme) => (
        <Image
          key={theme}
          src={`/brand/${name}-${theme === "dark" ? "light" : "dark"}.svg`}
          alt={alt}
          className={`${className} show-in-${theme}`}
          unoptimized
          {...props}
        />
      ))}
    </>
  );
}

export function ThemedLogo({ className }: { className: string }) {
  return (
    <ThemedImage
      name="logo"
      alt="Omnivix"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={className}
      style={{ width: "auto" }}
      loading="eager"
    />
  );
}

export function ThemedIcon({ className, size }: { className: string; size: number }) {
  return <ThemedImage name="icon" alt="" width={size} height={size} className={className} />;
}
