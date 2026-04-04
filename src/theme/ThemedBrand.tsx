"use client";

import Image from "next/image";
import { useTheme } from "@/src/theme/ThemeProvider";

/** Wordmark viewBox 968×274 — props must match that ratio for fixed height (h-9). */
const LOGO_WIDTH = Math.round((36 * 968) / 274);
const LOGO_HEIGHT = 36;

export function ThemedLogo({ className = "h-9 w-auto" }: { className?: string }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/logo-light.svg" : "/brand/logo-dark.svg";
  return (
    <Image
      src={src}
      alt="Omnivix"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={className}
      style={{ width: "auto" }}
      priority
      unoptimized
    />
  );
}

export function ThemedIcon({ className = "h-6 w-6", size = 24 }: { className?: string; size?: number }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/icon-light.svg" : "/brand/icon-dark.svg";
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
