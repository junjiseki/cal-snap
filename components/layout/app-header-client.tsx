"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, LogIn, Menu, UserPlus, X } from "lucide-react";
import { DashboardAccountMenu } from "@/components/meals/dashboard-account-menu";
import { cn } from "@/lib/utils";

export type AppHeaderAccount = {
  email: string;
  displayName: string;
  plan: string;
  freeDailyAnalysisLimit: number;
  paidDailyAnalysisLimit: number;
};

export function AppHeaderClient({
  account,
  className,
}: {
  account: AppHeaderAccount | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isDashboardPage = pathname === "/dashboard";
  const isMealAnalyzerPage = pathname === "/meals/new";
  const closeMobileMenuSoon = () => {
    window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={cn("sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <Link
            href={account ? "/meals/new" : "/"}
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <Image
              src="/logo.png"
              alt="カロリースナップ AI ロゴ"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-md sm:size-12"
            />
            <span className="truncate text-base font-semibold sm:text-lg">カロリースナップ</span>
          </Link>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="app-header-mobile-nav"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <nav
            className="hidden items-center gap-2 md:flex md:flex-wrap md:gap-3"
            aria-label="メインナビゲーション"
          >
            {account ? (
              <DashboardAccountMenu
                email={account.email}
                displayName={account.displayName}
                plan={account.plan}
                freeDailyAnalysisLimit={account.freeDailyAnalysisLimit}
                paidDailyAnalysisLimit={account.paidDailyAnalysisLimit}
              />
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 top-[65px] z-50 md:hidden">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="absolute inset-0 bg-foreground/15 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <nav
            id="app-header-mobile-nav"
            className="absolute inset-x-0 top-0 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-150"
            aria-label="モバイルメニュー"
          >
            <div className="mx-auto w-full max-w-7xl px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary">Menu</p>
                  <p className="mt-1 text-sm font-semibold">カロリースナップ</p>
                </div>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
                  onClick={() => setOpen(false)}
                  aria-label="メニューを閉じる"
                >
                  <X className="size-4" />
                </button>
              </div>

              {account ? (
                <div className="space-y-2">
                  <Link
                    href="/meals/new"
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold",
                      isMealAnalyzerPage
                        ? "pointer-events-none bg-primary/10 text-primary"
                        : "bg-primary text-primary-foreground shadow-sm",
                    )}
                    onClick={closeMobileMenuSoon}
                    aria-current={isMealAnalyzerPage ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
                        isMealAnalyzerPage ? "bg-primary/15" : "bg-primary-foreground/15",
                      )}
                    >
                      <Camera className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">食事写真をAI解析</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold",
                      isDashboardPage && "pointer-events-none border-primary/25 bg-primary/10 text-primary",
                    )}
                    onClick={closeMobileMenuSoon}
                    aria-current={isDashboardPage ? "page" : undefined}
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <BarChart3 className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">ダッシュボード</span>
                  </Link>
                  <div className="mt-4 border-t border-border pt-4">
                    <DashboardAccountMenu
                      email={account.email}
                      displayName={account.displayName}
                      plan={account.plan}
                      freeDailyAnalysisLimit={account.freeDailyAnalysisLimit}
                      paidDailyAnalysisLimit={account.paidDailyAnalysisLimit}
                      compact
                      onNavigate={closeMobileMenuSoon}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Link
                    href="/signup"
                    className="flex min-h-12 w-full items-center gap-3 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm"
                    onClick={closeMobileMenuSoon}
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                      <UserPlus className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">無料で始める</span>
                  </Link>
                  <Link
                    href="/login"
                    className="flex min-h-12 w-full items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold"
                    onClick={closeMobileMenuSoon}
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <LogIn className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">ログイン</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
