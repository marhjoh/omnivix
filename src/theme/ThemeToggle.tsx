"use client";

import { useTheme } from "@/src/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className: string }) {
  const { theme, toggle } = useTheme();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button type="button" onClick={toggle} className={className} aria-label={label}>
      {/* Both icons; CSS shows the one for the current theme, so it's right before React loads. */}
      <Sun className="show-in-dark h-[18px] w-[18px]" aria-hidden />
      <Moon className="show-in-light h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
