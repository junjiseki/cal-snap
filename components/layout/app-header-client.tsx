"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, LogIn, Menu, UserPlus, X } from "lucide-react";
import { DashboardAccountMenu } from "@/components/meals/dashboard-account-menu";
import { cn } from "@/lib/utils";

export type AppHeaderAccount = {
  email: string;
  plan: string;
  initialGoal: number;
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
              <>
                {!isDashboardPage ? (
                  <Link
                    href="/dashboard"
                    className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    ダッシュボード
                  </Link>
                ) : null}
                {!isMealAnalyzerPage ? (
                  <Link
                    href="/meals/new"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    <Camera className="size-4" />
                    食事写真をAI解析
                  </Link>
                ) : null}
              </>
            ) : null}
            {account ? (
              <DashboardAccountMenu
                email={account.email}
                plan={account.plan}
                initialGoal={account.initialGoal}
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
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <nav
            id="app-header-mobile-nav"
            className="absolute right-3 top-3 max-h-[calc(100dvh-5.5rem)] w-[min(calc(100vw-1.5rem),23rem)] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-xl"
            aria-label="モバイルメニュー"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">メニュー</p>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background"
                onClick={() => setOpen(false)}
                aria-label="メニューを閉じる"
              >
                <X className="size-4" />
              </button>
            </div>

            {account ? (
              <div className="space-y-3">
                <Link
                  href="/meals/new"
                  className={cn(
                    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm",
                    isMealAnalyzerPage && "pointer-events-none opacity-70",
                  )}
                  onClick={closeMobileMenuSoon}
                >
                  <Camera className="size-4" />
                  食事写真をAI解析
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted",
                    isDashboardPage && "pointer-events-none bg-muted text-muted-foreground",
                  )}
                  onClick={closeMobileMenuSoon}
                >
                  <BarChart3 className="size-4" />
                  ダッシュボード
                </Link>
                <div className="border-t border-border pt-4">
                  <DashboardAccountMenu
                    email={account.email}
                    plan={account.plan}
                    initialGoal={account.initialGoal}
                    freeDailyAnalysisLimit={account.freeDailyAnalysisLimit}
                    paidDailyAnalysisLimit={account.paidDailyAnalysisLimit}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
                  onClick={closeMobileMenuSoon}
                >
                  <UserPlus className="size-4" />
                  無料で始める
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
                  onClick={closeMobileMenuSoon}
                >
                  <LogIn className="size-4" />
                  ログイン
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
