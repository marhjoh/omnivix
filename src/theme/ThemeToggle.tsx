"use client";

import { useTheme } from "@/src/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className: string }) {
  const { theme, toggle } = useTheme();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button type="button" onClick={toggle} className={className} aria-label={label}>
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
