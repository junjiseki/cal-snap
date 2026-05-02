import { z } from "zod";
import { getTodayRangeInJapan } from "@/lib/meal-analysis";

export const MEAL_SUGGESTION_DAILY_LIMIT = 3;

export const MealSuggestionContextSchema = z.enum(["eat_out", "cook", "convenience"]);
export const MealSuggestionSlotSchema = z.enum(["breakfast", "lunch", "dinner"]);

export const MealSuggestionRequestSchema = z.object({
  context: MealSuggestionContextSchema,
  slot: MealSuggestionSlotSchema,
});

export const MealSuggestionMenuSchema = z.object({
  title: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(1).max(240),
  items: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  estimated_calories: z.number().min(0).max(100_000),
  protein: z.number().min(0).max(100_000),
  fat: z.number().min(0).max(100_000),
  carbs: z.number().min(0).max(100_000),
  adjustment_tip: z.string().trim().min(1).max(240),
});

export const MealSuggestionResponseSchema = z.object({
  summary: z.string().trim().min(1).max(360),
  suggestions: z.array(MealSuggestionMenuSchema).min(1).max(3),
});

export type MealSuggestionContext = z.infer<typeof MealSuggestionContextSchema>;
export type MealSuggestionSlot = z.infer<typeof MealSuggestionSlotSchema>;
export type MealSuggestionResponse = z.infer<typeof MealSuggestionResponseSchema>;

export const mealSuggestionContextLabels: Record<MealSuggestionContext, string> = {
  eat_out: "外食",
  cook: "自炊",
  convenience: "コンビニ",
};

export const mealSuggestionSlotLabels: Record<MealSuggestionSlot, string> = {
  breakfast: "朝ご飯",
  lunch: "昼食",
  dinner: "夜ご飯",
};

export function getTodaySuggestionUsageRange() {
  return getTodayRangeInJapan();
}
