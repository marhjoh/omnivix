"use client";

import Image from "next/image";
import { useTheme } from "@/src/theme/ThemeProvider";

export function ThemedLogo({ className = "h-9 w-auto" }: { className?: string }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/logo-light.svg" : "/brand/logo-dark.svg";
  return <Image src={src} alt="Omnivix" width={160} height={36} className={className} priority />;
}

export function ThemedIcon({ className = "h-6 w-6", size = 24 }: { className?: string; size?: number }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/brand/icon-light.svg" : "/brand/icon-dark.svg";
  return <Image src={src} alt="" width={size} height={size} className={className} />;
}
