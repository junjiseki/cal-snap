import { z } from "zod";

export const MAX_MEAL_REMINDER_SETTINGS = 8;
export const MEAL_REMINDER_TIME_STEP_SECONDS = 600;

/** `app/api/cron/meal-reminders` の getDueWindow 既定（分）と一致 */
export const MEAL_REMINDER_CRON_WINDOW_MINUTES = 10;

/**
 * 食事記録を「この notify 枠」の完了とみなす範囲の手前（分）。
 * 例: 18:00 枠で 17:55 の記録は 12:00 枠ではなく 18:00 枠へ紐づける。
 */
export const MEAL_REMINDER_COMPLETION_EARLY_MINUTES = 60;

const TEN_MINUTE_TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]0$/;

export const MealReminderSettingSchema = z.object({
  id: z.string().uuid().optional(),
  notify_time: z.string().regex(TEN_MINUTE_TIME_REGEX),
  enabled: z.boolean(),
});

export const MealReminderSettingsPayloadSchema = z.object({
  settings: z.array(MealReminderSettingSchema).max(MAX_MEAL_REMINDER_SETTINGS),
});

export type MealReminderSettingInput = z.infer<typeof MealReminderSettingSchema>;

export function normalizeNotifyTime(value: string) {
  return value.slice(0, 5);
}

export function isTenMinuteTime(value: string) {
  return TEN_MINUTE_TIME_REGEX.test(normalizeNotifyTime(value));
}

/** JST の日付内で 0:00 からの経過分（秒は切り捨て） */
export function minutesFromMidnightJapan(eatenAt: Date): number {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(eatenAt);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  return n("hour") * 60 + n("minute");
}

/** DBの time / 文字列（例: 18:00:00）を 0:00 からの経過分に */
export function parseNotifyTimeToMinutes(notifyTime: string): number {
  const head = notifyTime.trim().split("+")[0]?.trim() ?? "";
  const [hRaw, mRaw] = head.split(":");
  const h = Number.parseInt(hRaw ?? "", 10);
  const m = Number.parseInt(mRaw ?? "", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN;
  return h * 60 + m;
}

/**
 * 食事時刻が cron の送付ウィンドウ（notify の T 〜 T+(窓-1) 分）と、手前の帯に収まる設定を1件選ぶ。
 * 複数に重なる場合は notify に最も近いもの。
 */
export function pickMealReminderSettingIdForEatenAt(
  eatenAt: Date,
  settings: { id: string; notify_time: string }[],
): string | null {
  const eatenMin = minutesFromMidnightJapan(eatenAt);
  const lateMax = MEAL_REMINDER_CRON_WINDOW_MINUTES - 1;
  let best: { id: string; dist: number } | null = null;

  for (const s of settings) {
    const t = parseNotifyTimeToMinutes(s.notify_time);
    if (!Number.isFinite(t)) continue;
    if (
      eatenMin < t - MEAL_REMINDER_COMPLETION_EARLY_MINUTES ||
      eatenMin > t + lateMax
    ) {
      continue;
    }
    const dist = Math.abs(eatenMin - t);
    if (!best || dist < best.dist) {
      best = { id: s.id, dist };
    }
  }

  return best?.id ?? null;
}
