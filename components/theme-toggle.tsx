"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50 sm:min-w-10 sm:px-3",
        className,
      )}
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      title={isDark ? "ライトモード" : "ダークモード"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 shrink-0" />
        ) : (
          <Moon className="size-4 shrink-0" />
        )
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
      {mounted ? (
        <span className="hidden sm:inline">{isDark ? "ライト" : "ダーク"}</span>
      ) : null}
    </button>
  );
}
