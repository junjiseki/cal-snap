"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  MEAL_REMINDER_TYPES,
  type MealReminderSettingInput,
  normalizeNotifyTime,
} from "@/lib/meal-reminders";

type ExistingSetting = {
  meal_type: MealReminderSettingInput["meal_type"];
  notify_time: string;
  enabled: boolean;
};

function createInitialSettings(existing: ExistingSetting[]): MealReminderSettingInput[] {
  const byType = new Map(existing.map((setting) => [setting.meal_type, setting]));
  return MEAL_REMINDER_TYPES.map((type) => {
    const saved = byType.get(type.value);
    return {
      meal_type: type.value,
      notify_time: normalizeNotifyTime(saved?.notify_time ?? type.defaultTime),
      enabled: saved?.enabled ?? false,
    };
  });
}

export function MealReminderSettingsForm({
  initialSettings,
}: {
  initialSettings: ExistingSetting[];
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => createInitialSettings(initialSettings));
  const [savedSettings, setSavedSettings] = useState(() => createInitialSettings(initialSettings));
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );
  const enabledCount = settings.filter((setting) => setting.enabled).length;

  function updateSetting(
    mealType: MealReminderSettingInput["meal_type"],
    patch: Partial<Pick<MealReminderSettingInput, "notify_time" | "enabled">>,
  ) {
    setSettings((current) =>
      current.map((setting) =>
        setting.meal_type === mealType ? { ...setting, ...patch } : setting,
      ),
    );
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/meal-reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? "食事時間を保存できません。");
      }

      setSavedSettings(settings);
      setNotice("食事時間を保存しました。");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-muted/25 p-3">
        <p className="text-sm font-semibold">有効な食事時間: {enabledCount} / 8</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          必要な時間だけオンにしてください。通知送信処理はこの設定をもとに実装できます。
        </p>
      </div>

      <div className="grid gap-3">
        {MEAL_REMINDER_TYPES.map((type) => {
          const setting = settings.find((item) => item.meal_type === type.value);
          if (!setting) return null;

          return (
            <div
              key={type.value}
              className="grid gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-center"
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={(event) =>
                    updateSetting(type.value, { enabled: event.target.checked })
                  }
                  className="mt-1 size-4 rounded border-input accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold">{type.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {setting.enabled ? "記録を促す時間として使用します。" : "オフ"}
                  </span>
                </span>
              </label>
              <input
                type="time"
                value={setting.notify_time}
                onChange={(event) =>
                  updateSetting(type.value, { notify_time: event.target.value })
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
              <span className="text-xs text-muted-foreground sm:text-right">
                {setting.enabled ? "有効" : "無効"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!isDirty || isSaving}
          aria-busy={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSaving ? "保存中..." : "食事時間を保存"}
        </button>
        {notice ? <p className="text-sm text-primary">{notice}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
