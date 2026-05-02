"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function DashboardAccountMenu({
  email,
  displayName,
  plan,
  freeDailyAnalysisLimit,
  paidDailyAnalysisLimit,
  compact = false,
}: {
  email: string;
  displayName: string;
  plan: string;
  freeDailyAnalysisLimit: number;
  paidDailyAnalysisLimit: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
      setOpen(false);
      router.refresh();
      router.push("/login");
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const planLabel = plan === "paid" ? "有料" : "無料";
  const accountName = displayName.trim() || "アカウント";
  const avatarLabel = displayName.trim().slice(0, 1).toUpperCase();
  const avatar = avatarLabel || <User className="size-4" />;
  const billingLabel = plan === "paid" ? "プラン管理" : "アップグレードプラン";
  const menuLinks = [
    {
      href: "/profile",
      label: "プロフィール編集",
      description: "1日の摂取カロリーを設定",
      icon: User,
    },
    {
      href: "/billing",
      label: billingLabel,
      description: "AI解析枠と支払いを管理",
      icon: CreditCard,
    },
    {
      href: "/settings",
      label: "設定",
      description: "ログアウト・アカウント操作",
      icon: Settings,
    },
  ] as const;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
              {avatar}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{accountName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-primary">
            {planLabel}
          </span>
        </div>
        <div className="grid gap-2">
          {menuLinks.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            AI解析枠: 無料 {freeDailyAnalysisLimit}回 / 有料 {paidDailyAnalysisLimit}回
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={signingOut}
          onClick={() => void handleSignOut()}
          className="h-11 w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          {signingOut ? "ログアウト中..." : "ログアウト"}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "アカウントメニューを閉じる" : "アカウントメニューを開く"}
        className="gap-2"
      >
        <span className="text-xs font-semibold" aria-hidden>
          {avatar}
        </span>
      </Button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-border bg-card p-3 shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <p className="mt-1 truncate text-sm font-semibold">{accountName}</p>
            </div>
            <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-primary">
              {planLabel}
            </span>
          </div>
          <div className="grid gap-1 border-t border-border pt-2">
            {menuLinks.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                className="flex min-h-12 items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className="h-10 w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              {signingOut ? "ログアウト中..." : "ログアウト"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
