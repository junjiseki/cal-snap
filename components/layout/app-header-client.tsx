"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Camera,
  ImageUp,
  LogIn,
  Menu,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { DashboardAccountMenu } from "@/components/meals/dashboard-account-menu";
import {
  PENDING_MEAL_PHOTO_EVENT,
  setPendingMealPhoto,
} from "@/lib/pending-meal-photo";
import { APP_HEADER_MOBILE_MENU_CLOSE_DELAY_MS } from "@/lib/ui-timing";
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
  const bottomCameraInputRef = useRef<HTMLInputElement>(null);
  const mobileNavId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const isDashboardPage = pathname === "/dashboard";
  const isMealAnalyzerPage = pathname === "/meals/new";
  const isSuggestionsPage = pathname === "/suggestions";
  const closeMobileMenuSoon = () => {
    window.setTimeout(
      () => setOpen(false),
      APP_HEADER_MOBILE_MENU_CLOSE_DELAY_MS,
    );
  };

  useEffect(() => {
    void pathname;
    setOpen(false);
  }, [pathname]);

  function handleBottomCameraFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    setPendingMealPhoto(selected);
    window.dispatchEvent(new Event(PENDING_MEAL_PHOTO_EVENT));
    if (pathname !== "/meals/new") {
      router.push("/meals/new");
    }
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur",
          className,
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            <Link
              href={account ? "/dashboard" : "/"}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <Image
                src="/logo.webp"
                alt="カロスナ AI ロゴ"
                width={48}
                height={48}
                className="size-10 shrink-0 rounded-md sm:size-12"
                sizes="(min-width: 640px) 48px, 40px"
                priority
              />
              <span className="truncate text-base font-semibold sm:text-lg">
                カロスナ
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-sm md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={mobileNavId}
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
              id={mobileNavId}
              className="mobile-menu-enter absolute inset-x-0 top-0 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-border bg-card shadow-lg"
              aria-label="モバイルメニュー"
            >
              <div className="mx-auto w-full max-w-7xl px-4 py-4">
                <div className="mb-3">
                  <div>
                    <p className="text-xs font-semibold text-primary">Menu</p>
                    <p className="mt-1 text-sm font-semibold">カロスナ</p>
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
                      <span className="min-w-0 flex-1 text-left">
                        無料で始める
                      </span>
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
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
          aria-label="ボトムナビゲーション"
        >
          <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5 rounded-2xl bg-muted/45 p-1">
            <Link
              href="/dashboard"
              aria-current={isDashboardPage ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition active:scale-[0.98]",
                isDashboardPage
                  ? "bg-card text-primary shadow-sm ring-1 ring-border"
                  : "text-muted-foreground active:bg-muted",
              )}
            >
              <BarChart3 className="size-5" />
              ダッシュボード
            </Link>
            <div
              className={cn(
                "flex min-h-14 min-w-0 overflow-hidden rounded-xl text-xs font-semibold transition active:scale-[0.98]",
                isMealAnalyzerPage
                  ? "bg-card text-primary shadow-sm ring-1 ring-border"
                  : "text-muted-foreground",
              )}
            >
              <Link
                href="/meals/new"
                aria-current={isMealAnalyzerPage ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1 active:scale-[0.98]",
                  !isMealAnalyzerPage && "active:bg-muted",
                )}
              >
                <Camera className="size-5 shrink-0" />
                <span className="leading-none">記録</span>
              </Link>
              <button
                type="button"
                onClick={() => bottomCameraInputRef.current?.click()}
                className={cn(
                  "flex w-[42%] max-w-21 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-border/70 px-0.5 py-1 active:scale-[0.98]",
                  !isMealAnalyzerPage && "active:bg-muted",
                )}
                aria-label="写真を選んで記録へ"
              >
                <ImageUp className="size-4 shrink-0" />
                <span className="text-[10px] font-semibold leading-none">
                  写真
                </span>
              </button>
            </div>
            <input
              ref={bottomCameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={handleBottomCameraFileChange}
            />
            <Link
              href="/suggestions"
              aria-current={isSuggestionsPage ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition active:scale-[0.98]",
                isSuggestionsPage
                  ? "bg-card text-primary shadow-sm ring-1 ring-border"
                  : "text-muted-foreground active:bg-muted",
              )}
            >
              <Sparkles className="size-5" />
              提案
            </Link>
          </div>
        </nav>
      ) : null}
    </>
  );
}
