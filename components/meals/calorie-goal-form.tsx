"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CalorieGoalForm({ initialGoal }: { initialGoal: number }) {
  const router = useRouter();
  const [goal, setGoal] = useState(String(initialGoal));
  const [savedGoal, setSavedGoal] = useState(initialGoal);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedGoal(initialGoal);
    setGoal(String(initialGoal));
  }, [initialGoal]);

  const parsed = Number(goal);
  const isValid = goal !== "" && Number.isInteger(parsed) && parsed >= 0;
  const isDirty = isValid && parsed !== savedGoal;
  const canSubmit = isDirty && !isSaving;

  async function save() {
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/calorie-goal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_calorie_goal: parsed }),
      });
      if (!response.ok) {
        throw new Error("摂取カロリーを保存できませんでした。");
      }
      setSavedGoal(parsed);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="number"
          min={0}
          step={1}
          value={goal}
          onChange={(e) => {
            setGoal(e.target.value);
            setError(null);
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-48"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSubmit}
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "摂取カロリーを設定"}
        </button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!isValid && goal !== "" ? (
        <p className="text-xs text-muted-foreground">
          0以上の整数で入力してください。
        </p>
      ) : null}
    </div>
  );
}
