"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function PublicAppHeaderClient({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const mobileNavId = useId();
  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            onClick={close}
          >
            <Image
              src="/logo.webp"
              alt="カロスナ AI ロゴ"
              width={48}
              height={48}
              className="size-10 shrink-0 rounded-md sm:size-12"
              sizes="(min-width: 640px) 48px, 40px"
              priority
              loading="eager"
            />
            <span className="truncate text-base font-semibold sm:text-lg">
              カロスナ
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex size-10 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border bg-background shadow-sm md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={mobileNavId}
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          >
            <span
              className={cn(
                "h-0.5 w-5 rounded-full bg-foreground transition-transform",
                open && "translate-y-1.5 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 rounded-full bg-foreground transition-opacity",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-5 rounded-full bg-foreground transition-transform",
                open && "-translate-y-1.5 -rotate-45",
              )}
            />
          </button>

          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="メインナビゲーション"
          >
            <Link
              href="/login"
              className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-md px-2 py-2 text-sm font-semibold text-primary hover:bg-muted/50"
            >
              新規登録
            </Link>
          </nav>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 top-[65px] z-50 md:hidden">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="absolute inset-0 bg-foreground/15 backdrop-blur-[2px]"
            onClick={close}
          />
          <nav
            id={mobileNavId}
            className="mobile-menu-enter absolute inset-x-0 top-0 border-b border-border bg-card shadow-lg"
            aria-label="モバイルメニュー"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-2 px-4 py-4">
              <Link
                href="/signup"
                className="flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm"
                onClick={close}
              >
                無料で始める
              </Link>
              <Link
                href="/login"
                className="flex min-h-12 w-full items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold"
                onClick={close}
              >
                ログイン
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
