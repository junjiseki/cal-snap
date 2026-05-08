import { z } from "zod";

export const MAX_MEAL_REMINDER_SETTINGS = 8;
export const MEAL_REMINDER_TIME_STEP_SECONDS = 600;

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
