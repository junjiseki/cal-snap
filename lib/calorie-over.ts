/**
 * 目標カロリー超過の表示レベル（ダッシュボード・チャート・LP など）。
 * Zod を含まないため、クライアントバンドルから重い依存を切り離せる。
 */
export const CALORIE_OVER_WARN_THRESHOLD_KCAL = 300;

export type CalorieOverLevel = "none" | "warn" | "severe";

export function getCalorieOverLevel(
  totalCalories: number,
  goalCalories: number,
): CalorieOverLevel {
  const over = totalCalories - goalCalories;
  if (over <= 0) return "none";
  if (over <= CALORIE_OVER_WARN_THRESHOLD_KCAL) return "warn";
  return "severe";
}
