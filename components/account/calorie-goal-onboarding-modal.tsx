"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CalorieGoalOnboardingModal({
  initialGoal,
  shouldShow,
}: {
  initialGoal: number;
  shouldShow: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(String(initialGoal));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldShow) {
      const timer = window.setTimeout(() => setOpen(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [shouldShow]);

  const parsed = Number(goal);
  const isValid = goal !== "" && Number.isInteger(parsed) && parsed > 0;

  async function markDismissed() {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        calorie_goal_prompt_dismissed: true,
      },
    });
  }

  async function closeForLater() {
    setIsSaving(true);
    try {
      await markDismissed();
      setOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function saveGoal() {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/calorie-goal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_calorie_goal: parsed }),
      });

      if (!response.ok) {
        throw new Error("1日の摂取カロリーを保存できませんでした。");
      }

      await markDismissed();
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "保存に失敗しました。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-foreground/30 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md border border-border bg-card p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Target className="size-5" />
          </span>
          <button
            type="button"
            onClick={() => void closeForLater()}
            disabled={isSaving}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="あとで設定する"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 id={titleId} className="mt-4 text-xl font-semibold">
          まず1日の摂取カロリーを設定
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          今日の残りカロリーと進捗バーの基準になります。あとからプロフィールで変更できます。
        </p>

        <label className="mt-5 block text-sm font-medium">
          1日の目安 kcal
          <input
            type="number"
            min={1}
            step={1}
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              setError(null);
            }}
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-base"
            inputMode="numeric"
          />
        </label>
        {!isValid ? (
          <p className="mt-2 text-xs text-muted-foreground">
            1以上の整数で入力してください。
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={() => void saveGoal()}
            disabled={!isValid || isSaving}
            aria-busy={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSaving ? "保存中..." : "設定して始める"}
          </button>
          <button
            type="button"
            onClick={() => void closeForLater()}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
