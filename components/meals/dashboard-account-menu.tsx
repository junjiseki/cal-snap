"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalorieGoalForm } from "@/components/meals/calorie-goal-form";
import { UpgradePlanButton } from "@/components/meals/upgrade-plan-button";
import { createClient } from "@/lib/supabase/client";

export function DashboardAccountMenu({
  email,
  plan,
  initialGoal,
  freeDailyAnalysisLimit,
  paidDailyAnalysisLimit,
  compact = false,
}: {
  email: string;
  plan: string;
  initialGoal: number;
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

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
              <User className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">アカウント</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-background px-2.5 py-1 text-xs font-semibold text-primary">
            {planLabel}
          </span>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">AI解析枠</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            無料は1日{freeDailyAnalysisLimit}回、有料は1日{paidDailyAnalysisLimit}
            回まで利用できます。
          </p>
          {plan !== "paid" ? (
            <div className="mt-3">
              <UpgradePlanButton />
            </div>
          ) : null}
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">1日の摂取カロリー</p>
          <div className="mt-3">
            <CalorieGoalForm key={initialGoal} initialGoal={initialGoal} />
          </div>
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
        <User className="size-4" aria-hidden />
      </Button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-border bg-card p-4 shadow-lg"
          role="menu"
        >
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">プラン</p>
            <p className="text-sm font-semibold">{planLabel}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              無料は1日{freeDailyAnalysisLimit}回、有料は1日{paidDailyAnalysisLimit}
              回までAI解析できます。
            </p>
            {plan !== "paid" ? (
              <div className="mt-3">
                <UpgradePlanButton />
              </div>
            ) : null}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">1日の摂取カロリー</p>
            <p className="mt-1 text-xs text-muted-foreground">
              グラフの基準線にも反映されます。
            </p>
            <div className="mt-3">
              <CalorieGoalForm key={initialGoal} initialGoal={initialGoal} />
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
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
