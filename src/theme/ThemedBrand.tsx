import Image from "next/image";

/*
 * Both variants are rendered; CSS on <html data-theme> shows one (see globals.css). That way the
 * logo switches in the same frame as the colours, and is right before React hydrates.
 * The "light" artwork is the one drawn for dark backgrounds.
 */

/** Wordmark viewBox 968×274 — props must match that ratio for fixed height (h-9). */
const LOGO_WIDTH = Math.round((36 * 968) / 274);
const LOGO_HEIGHT = 36;

export function ThemedLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <>
      {(["dark", "light"] as const).map((theme) => (
        <Image
          key={theme}
          src={theme === "dark" ? "/brand/logo-light.svg" : "/brand/logo-dark.svg"}
          alt="Omnivix"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className={`${className} show-in-${theme}`}
          style={{ width: "auto" }}
          loading="eager"
          unoptimized
        />
      ))}
    </>
  );
}

export function ThemedIcon({ className = "h-6 w-6", size = 24 }: { className?: string; size?: number }) {
  return (
    <>
      {(["dark", "light"] as const).map((theme) => (
        <Image
          key={theme}
          src={theme === "dark" ? "/brand/icon-light.svg" : "/brand/icon-dark.svg"}
          alt=""
          width={size}
          height={size}
          className={`${className} show-in-${theme}`}
          unoptimized
        />
      ))}
    </>
  );
}
