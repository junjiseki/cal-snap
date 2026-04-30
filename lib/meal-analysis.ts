import { z } from "zod";

export const MealAnalysisItemSchema = z.object({
  name: z.string(),
  estimated_amount: z.string(),
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  confidence: z.number(),
});

export const MealAnalysisSchema = z.object({
  total_calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  ai_confidence: z.number(),
  memo: z.string(),
  items: z.array(MealAnalysisItemSchema),
});

export const MealRegistrationSchema = MealAnalysisSchema.extend({
  eaten_at: z.string(),
});

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;
export type MealRegistration = z.infer<typeof MealRegistrationSchema>;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_FREE_DAILY_ANALYSIS_LIMIT = 1;
const DEFAULT_PAID_DAILY_ANALYSIS_LIMIT = 3;

function readPositiveIntEnv(name: string, fallback: number) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : NaN;
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const FREE_DAILY_ANALYSIS_LIMIT = readPositiveIntEnv(
  "FREE_DAILY_ANALYSIS_LIMIT",
  DEFAULT_FREE_DAILY_ANALYSIS_LIMIT,
);
export const PAID_DAILY_ANALYSIS_LIMIT = readPositiveIntEnv(
  "PAID_DAILY_ANALYSIS_LIMIT",
  DEFAULT_PAID_DAILY_ANALYSIS_LIMIT,
);

export function getDailyAnalysisLimit(plan: "free" | "paid") {
  return plan === "paid" ? PAID_DAILY_ANALYSIS_LIMIT : FREE_DAILY_ANALYSIS_LIMIT;
}

export function getTodayRangeInJapan() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());

  return {
    date: today,
    start: new Date(`${today}T00:00:00.000+09:00`).toISOString(),
    end: new Date(`${today}T23:59:59.999+09:00`).toISOString(),
  };
}

export function getDayRangeInJapan(inputDate?: string) {
  const today = getTodayRangeInJapan();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(inputDate ?? "") ? (inputDate as string) : today.date;

  return {
    date,
    start: new Date(`${date}T00:00:00.000+09:00`).toISOString(),
    end: new Date(`${date}T23:59:59.999+09:00`).toISOString(),
    isToday: date === today.date,
  };
}

export function toInteger(value: number) {
  return Math.max(0, Math.round(value));
}

export function toConfidence(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}
