"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  MAX_MEAL_REMINDER_SETTINGS,
  type MealReminderSettingInput,
  isThirtyMinuteTime,
  normalizeNotifyTime,
} from "@/lib/meal-reminders";

type ExistingSetting = {
  id: string;
  notify_time: string;
  enabled: boolean;
};

type EditableSetting = MealReminderSettingInput & {
  clientId: string;
};

function createClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function normalizeToThirtyMinuteTime(value: string) {
  const normalized = normalizeNotifyTime(value);
  if (isThirtyMinuteTime(normalized)) return normalized;

  const [hoursText = "00", minutesText = "00"] = normalized.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);
  const safeHours = Number.isFinite(hours) ? Math.min(23, Math.max(0, hours)) : 0;
  const safeMinutes = Number.isFinite(minutes) ? Math.min(59, Math.max(0, minutes)) : 0;
  const roundedMinutes = Math.floor(safeMinutes / 30) * 30;
  return `${String(safeHours).padStart(2, "0")}:${String(roundedMinutes).padStart(2, "0")}`;
}

function createInitialSettings(existing: ExistingSetting[]): EditableSetting[] {
  return existing.map((setting) => ({
    id: setting.id,
    clientId: setting.id,
    notify_time: normalizeToThirtyMinuteTime(setting.notify_time),
    enabled: setting.enabled,
  }));
}

function getNextRoundedTime() {
  const date = new Date();
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  date.setMinutes(roundedMinutes, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getThirtyMinuteTimeOptions() {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return options;
}

function toPayload(settings: EditableSetting[]): MealReminderSettingInput[] {
  return settings
    .map(({ id, notify_time, enabled }) => ({
      ...(id ? { id } : {}),
      notify_time: normalizeNotifyTime(notify_time),
      enabled,
    }))
    .sort((a, b) => a.notify_time.localeCompare(b.notify_time));
}

export function MealReminderSettingsForm({
  initialSettings,
}: {
  initialSettings: ExistingSetting[];
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => createInitialSettings(initialSettings));
  const [savedSettings, setSavedSettings] = useState(() => toPayload(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  const payload = useMemo(() => toPayload(settings), [settings]);
  const isDirty = useMemo(
    () => JSON.stringify(payload) !== JSON.stringify(savedSettings),
    [payload, savedSettings],
  );
  const enabledCount = settings.filter((setting) => setting.enabled).length;
  const canAdd = settings.length < MAX_MEAL_REMINDER_SETTINGS;
  const timeOptions = useMemo(() => getThirtyMinuteTimeOptions(), []);

  function resetMessages() {
    setNotice(null);
    setError(null);
    setShowHowTo(false);
  }

  function addSetting() {
    if (!canAdd) {
      setError(`食事時間は最大${MAX_MEAL_REMINDER_SETTINGS}件まで登録できます。`);
      return;
    }

    setSettings((current) => [
      ...current,
      {
        clientId: createClientId(),
        notify_time: getNextRoundedTime(),
        enabled: true,
      },
    ]);
    resetMessages();
  }

  function updateSetting(
    clientId: string,
    patch: Partial<Pick<EditableSetting, "notify_time" | "enabled">>,
  ) {
    setSettings((current) =>
      current.map((setting) =>
        setting.clientId === clientId ? { ...setting, ...patch } : setting,
      ),
    );
    resetMessages();
  }

  function removeSetting(clientId: string) {
    setSettings((current) => current.filter((setting) => setting.clientId !== clientId));
    resetMessages();
  }

  async function save() {
    if (!isDirty || isSaving) return;

    const duplicatedTime = payload.find(
      (setting, index) =>
        payload.findIndex((item) => item.notify_time === setting.notify_time) !== index,
    );
    if (duplicatedTime) {
      setError("同じ時刻は複数登録できません。");
      return;
    }

    if (payload.some((setting) => !isThirtyMinuteTime(setting.notify_time))) {
      setError("食事時間は30分刻みで選択してください。");
      return;
    }

    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/meal-reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? "食事時間を保存できません。");
      }

      setSavedSettings(payload);
      setSettings((current) =>
        current
          .map((setting) => ({ ...setting, notify_time: normalizeNotifyTime(setting.notify_time) }))
          .sort((a, b) => a.notify_time.localeCompare(b.notify_time)),
      );
      setNotice("食事時間を保存しました。");
      setShowHowTo(true);
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
        <p className="text-sm font-semibold">
          登録済み: {settings.length} / {MAX_MEAL_REMINDER_SETTINGS}
          <span className="ml-3 text-muted-foreground">有効: {enabledCount}</span>
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          必要な時刻だけ追加して保存してください。時刻は30分刻みで登録できます。
        </p>
      </div>

      {settings.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
          まだ食事時間は登録されていません。「時間を追加」から、通知したい時刻だけ登録できます。
        </div>
      ) : (
        <div className="grid gap-3">
          {settings.map((setting, index) => (
            <div
              key={setting.clientId}
              className="grid gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-[1fr_10rem_auto] sm:items-center"
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={(event) =>
                    updateSetting(setting.clientId, { enabled: event.target.checked })
                  }
                  className="mt-1 size-4 rounded border-input accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold">食事時間 {index + 1}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {setting.enabled ? "通知対象です。" : "通知しません。"}
                  </span>
                </span>
              </label>
              <select
                value={setting.notify_time}
                onChange={(event) =>
                  updateSetting(setting.clientId, { notify_time: event.target.value })
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeSetting(setting.clientId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.98]"
              >
                <Trash2 className="size-4" />
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={addSetting}
          disabled={!canAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold transition hover:bg-muted active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4" />
          時間を追加
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!isDirty || isSaving}
          aria-busy={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSaving ? "保存中..." : "食事時間を保存"}
        </button>
        {notice ? <p className="text-sm text-primary">{notice}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {showHowTo ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold">登録方法</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
            <li>「時間を追加」から、記録を促したい時刻を追加します。</li>
            <li>通知したい時刻だけオンにします。</li>
            <li>保存すると、次回以降この時刻を基準に通知します。</li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
