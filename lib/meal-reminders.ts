import { z } from "zod";

export const MEAL_REMINDER_TYPES = [
  { value: "breakfast", label: "朝食", defaultTime: "08:00" },
  { value: "morning_snack", label: "午前の間食", defaultTime: "10:30" },
  { value: "lunch", label: "昼食", defaultTime: "12:30" },
  { value: "afternoon_snack", label: "午後の間食", defaultTime: "15:30" },
  { value: "dinner", label: "夕食", defaultTime: "19:00" },
  { value: "night_snack", label: "夜食", defaultTime: "21:30" },
  { value: "supplement_1", label: "補食1", defaultTime: "11:30" },
  { value: "supplement_2", label: "補食2", defaultTime: "17:30" },
] as const;

export type MealReminderType = (typeof MEAL_REMINDER_TYPES)[number]["value"];

export const MEAL_REMINDER_TYPE_VALUES = MEAL_REMINDER_TYPES.map((type) => type.value) as [
  MealReminderType,
  ...MealReminderType[],
];

export const MealReminderSettingSchema = z.object({
  meal_type: z.enum(MEAL_REMINDER_TYPE_VALUES),
  notify_time: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
});

export const MealReminderSettingsPayloadSchema = z.object({
  settings: z.array(MealReminderSettingSchema).length(MEAL_REMINDER_TYPES.length),
});

export type MealReminderSettingInput = z.infer<typeof MealReminderSettingSchema>;

export function normalizeNotifyTime(value: string) {
  return value.slice(0, 5);
}
