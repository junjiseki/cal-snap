"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, LogIn, Menu, Sparkles, UserPlus, X } from "lucide-react";
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
  const isSuggestionsPage = pathname === "/suggestions";
  const closeMobileMenuSoon = () => {
    window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
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
              <div className="mb-3">
                <div>
                  <p className="text-xs font-semibold text-primary">Menu</p>
                  <p className="mt-1 text-sm font-semibold">カロリースナップ</p>
                </div>
              </div>

              {account ? (
                <div className="space-y-2">
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
    {account ? (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="ボトムナビゲーション"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Link
            href="/dashboard"
            aria-current={isDashboardPage ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold",
              isDashboardPage
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground active:bg-muted",
            )}
          >
            <BarChart3 className="size-5" />
            ダッシュボード
          </Link>
          <Link
            href="/meals/new"
            aria-current={isMealAnalyzerPage ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold",
              isMealAnalyzerPage
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground active:bg-muted",
            )}
          >
            <Camera className="size-5" />
            食事解析
          </Link>
          <Link
            href="/suggestions"
            aria-current={isSuggestionsPage ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold",
              isSuggestionsPage
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground active:bg-muted",
            )}
          >
            <Sparkles className="size-5" />
            食事提案
          </Link>
        </div>
      </nav>
    ) : null}
    </>
  );
}
