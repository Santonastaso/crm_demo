import React from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export const ThemeSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex gap-2 items-center">
      <select
        aria-label="Theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          "w-36",
          className,
        )}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
};
