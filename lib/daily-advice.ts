import { z } from "zod";

export const DailyAdviceSchema = z.object({
  advice_text: z.string().trim().min(1).max(120),
  reason_text: z.string().trim().min(1).max(160),
  action_text: z.string().trim().min(1).max(160),
});

export type DailyAdvice = z.infer<typeof DailyAdviceSchema>;

export type DailyAdviceIssue =
  | "calories_too_low"
  | "protein_too_low"
  | "fat_too_high"
  | "night_calories_too_high"
  | "carbs_too_high"
  | "similar_meals"
  | "consistent_logging";

export type DailyAdviceMeal = {
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  meal_items?: { name: string }[];
};

export type DailyAdviceSummary = {
  period: "last_7_days";
  recorded_days: number;
  meal_count: number;
  avg_calories: number;
  avg_protein: number;
  avg_fat: number;
  avg_carbs: number;
  recent_3_day_avg_calories: number;
  calorie_diff_from_7_day_avg: number;
  pfc_ratio: {
    protein: number;
    fat: number;
    carbs: number;
  };
  meal_time_ratio: {
    morning: number;
    lunch: number;
    night: number;
  };
  repeated_meal_names: string[];
  selected_issue: DailyAdviceIssue;
  reason: string;
  goal_calories: number;
};

export type DailyAdviceResult =
  | { status: "plan_required" }
  | { status: "insufficient_data"; message: string }
  | { status: "ok"; advice: DailyAdvice; summary?: DailyAdviceSummary };

export type DailyAdviceGenerator = (summary: DailyAdviceSummary) => Promise<DailyAdvice>;

export const INSUFFICIENT_DAILY_ADVICE_MESSAGE =
  "まずは3日分記録すると、あなたに合ったアドバイスを表示できます。";

const ISSUE_PRIORITY: DailyAdviceIssue[] = [
  "calories_too_low",
  "protein_too_low",
  "fat_too_high",
  "night_calories_too_high",
  "carbs_too_high",
  "similar_meals",
  "consistent_logging",
];

function toJstDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function toJstHour(iso: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: false,
  });
  return Number(formatter.format(new Date(iso)));
}

function round(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function macroCalories(protein: number, fat: number, carbs: number) {
  return protein * 4 + fat * 9 + carbs * 4;
}

function ratio(part: number, total: number) {
  if (total <= 0) return 0;
  return round((part / total) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function hasEnoughDailyAdviceData(meals: DailyAdviceMeal[]) {
  const recordedDays = new Set(meals.map((meal) => toJstDate(new Date(meal.eaten_at)))).size;
  return recordedDays >= 3 && meals.length >= 5;
}

export function summarizeDailyAdviceMeals(
  meals: DailyAdviceMeal[],
  goalCalories: number,
): Omit<DailyAdviceSummary, "selected_issue" | "reason"> {
  const mealsByDay = new Map<string, DailyAdviceMeal[]>();
  for (const meal of meals) {
    const key = toJstDate(new Date(meal.eaten_at));
    mealsByDay.set(key, [...(mealsByDay.get(key) ?? []), meal]);
  }

  const dayCalories = [...mealsByDay.values()].map((dayMeals) =>
    dayMeals.reduce((sum, meal) => sum + meal.total_calories, 0),
  );

  const sortedDays = [...mealsByDay.keys()].sort();
  const recent3DayCalories = sortedDays
    .slice(-3)
    .map((day) => (mealsByDay.get(day) ?? []).reduce((sum, meal) => sum + meal.total_calories, 0));

  const totalCalories = meals.reduce((sum, meal) => sum + meal.total_calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const pfcCalories = macroCalories(totalProtein, totalFat, totalCarbs);

  const mealTimeCalories = { morning: 0, lunch: 0, night: 0 };
  const mealNameCounts = new Map<string, number>();
  for (const meal of meals) {
    const hour = toJstHour(meal.eaten_at);
    if (hour >= 4 && hour < 11) {
      mealTimeCalories.morning += meal.total_calories;
    } else if (hour >= 11 && hour < 17) {
      mealTimeCalories.lunch += meal.total_calories;
    } else {
      mealTimeCalories.night += meal.total_calories;
    }
    for (const item of meal.meal_items ?? []) {
      const name = item.name.trim();
      if (name) mealNameCounts.set(name, (mealNameCounts.get(name) ?? 0) + 1);
    }
  }

  return {
    period: "last_7_days",
    recorded_days: mealsByDay.size,
    meal_count: meals.length,
    avg_calories: round(average(dayCalories)),
    avg_protein: round(totalProtein / Math.max(meals.length, 1)),
    avg_fat: round(totalFat / Math.max(meals.length, 1)),
    avg_carbs: round(totalCarbs / Math.max(meals.length, 1)),
    recent_3_day_avg_calories: round(average(recent3DayCalories)),
    calorie_diff_from_7_day_avg: round(average(recent3DayCalories) - average(dayCalories)),
    pfc_ratio: {
      protein: ratio(totalProtein * 4, pfcCalories),
      fat: ratio(totalFat * 9, pfcCalories),
      carbs: ratio(totalCarbs * 4, pfcCalories),
    },
    meal_time_ratio: {
      morning: ratio(mealTimeCalories.morning, totalCalories),
      lunch: ratio(mealTimeCalories.lunch, totalCalories),
      night: ratio(mealTimeCalories.night, totalCalories),
    },
    repeated_meal_names: [...mealNameCounts.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name),
    goal_calories: goalCalories,
  };
}

export function selectDailyAdviceIssue(
  summary: Omit<DailyAdviceSummary, "selected_issue" | "reason">,
): Pick<DailyAdviceSummary, "selected_issue" | "reason"> {
  const candidates = new Map<DailyAdviceIssue, string>();

  if (summary.avg_calories < summary.goal_calories * 0.72) {
    candidates.set(
      "calories_too_low",
      `直近7日間の平均摂取カロリーが${summary.avg_calories}kcalで、目標${summary.goal_calories}kcalよりかなり低め`,
    );
  }
  if (summary.pfc_ratio.protein < 15 || summary.avg_protein < 20) {
    candidates.set(
      "protein_too_low",
      `直近7日間のPFC比率でたんぱく質が${summary.pfc_ratio.protein}%と少なめ`,
    );
  }
  if (summary.pfc_ratio.fat >= 32) {
    candidates.set(
      "fat_too_high",
      `直近7日間の脂質比率が${summary.pfc_ratio.fat}%で高め`,
    );
  }
  if (summary.meal_time_ratio.night >= 45) {
    candidates.set(
      "night_calories_too_high",
      `直近7日間の夜のカロリー比率が${summary.meal_time_ratio.night}%で高め`,
    );
  }
  if (summary.pfc_ratio.carbs >= 58) {
    candidates.set(
      "carbs_too_high",
      `直近7日間の炭水化物比率が${summary.pfc_ratio.carbs}%で高め`,
    );
  }
  if (summary.repeated_meal_names.length > 0) {
    candidates.set(
      "similar_meals",
      `直近7日間で${summary.repeated_meal_names.join("、")}が複数回記録されています`,
    );
  }
  candidates.set(
    "consistent_logging",
    `直近7日間で${summary.recorded_days}日、合計${summary.meal_count}件記録できています`,
  );

  for (const issue of ISSUE_PRIORITY) {
    const reason = candidates.get(issue);
    if (reason) return { selected_issue: issue, reason };
  }

  return {
    selected_issue: "consistent_logging",
    reason: `直近7日間で${summary.recorded_days}日、合計${summary.meal_count}件記録できています`,
  };
}

export function buildDailyAdviceSummary(
  meals: DailyAdviceMeal[],
  goalCalories: number,
): DailyAdviceSummary | null {
  if (!hasEnoughDailyAdviceData(meals)) return null;
  const baseSummary = summarizeDailyAdviceMeals(meals, goalCalories);
  const issue = selectDailyAdviceIssue(baseSummary);
  return { ...baseSummary, ...issue };
}

export function buildDailyAdvicePrompt(summary: DailyAdviceSummary) {
  return [
    "You write short Japanese diet advice for a food logging app.",
    "Return JSON only with advice_text, reason_text, action_text.",
    "The server already selected the issue. Do not choose another issue.",
    "Use only the aggregated summary below. Do not assume body weight, exercise, medical state, or hidden meal history.",
    "Constraints:",
    "- 1〜2文で短く",
    "- 抽象表現は禁止",
    "- 医療的な断定は禁止",
    "- 「痩せます」「必ず効果があります」は禁止",
    "- 次の1食で実行できる内容にする",
    "- ユーザーを責めない",
    "- やさしく前向きな文体にする",
    "NG examples:",
    "- バランスよく食べましょう",
    "- 健康的な食事を心がけましょう",
    "- 運動しましょう",
    "- 食べすぎに注意しましょう",
    `Aggregated summary:\n${JSON.stringify(summary)}`,
  ].join("\n");
}

export function getDailyAdviceCacheKey(userId: string, ymd: string) {
  return `daily_advice:${userId}:${ymd}`;
}

export function getTodayYmdInJapan() {
  return toJstDate(new Date());
}

export async function createDailyAdvice({
  plan,
  goalCalories,
  meals,
  generateAdvice,
}: {
  plan: "free" | "paid";
  goalCalories: number;
  meals: DailyAdviceMeal[];
  generateAdvice: DailyAdviceGenerator;
}): Promise<DailyAdviceResult> {
  if (plan !== "paid") {
    return { status: "plan_required" };
  }

  const summary = buildDailyAdviceSummary(meals, goalCalories);
  if (!summary) {
    return {
      status: "insufficient_data",
      message: INSUFFICIENT_DAILY_ADVICE_MESSAGE,
    };
  }

  const advice = await generateAdvice(summary);
  return { status: "ok", advice, summary };
}
