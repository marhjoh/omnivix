import Image, { type ImageProps } from "next/image";
import { brandSrc, BRAND_LOGO_SIZE } from "@/src/lib/site";

/*
 * Both variants render, and CSS on <html data-theme> shows one (see globals.css). The logo then
 * switches in the same frame as the colors and is right before React hydrates.
 */

/** The width and height props must match the wordmark's ratio at the h-9 height. */
const LOGO_HEIGHT = 36;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * BRAND_LOGO_SIZE.width) / BRAND_LOGO_SIZE.height);

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
          src={brandSrc(name, theme)}
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
