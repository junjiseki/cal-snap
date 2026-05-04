import { describe, expect, it, vi } from "vitest";
import {
  INSUFFICIENT_DAILY_ADVICE_MESSAGE,
  type DailyAdvice,
  type DailyAdviceMeal,
  buildDailyAdvicePrompt,
  buildDailyAdviceSummary,
  createDailyAdvice,
  selectDailyAdviceIssue,
} from "@/lib/daily-advice";

const advice: DailyAdvice = {
  advice_text: "直近7日は脂質が高めです。",
  reason_text: "脂質比率が35%で高めに出ています。",
  action_text: "次の食事は揚げ物を避けて、焼き魚か鶏むね肉を選んでみましょう。",
};

function meal(day: string, overrides: Partial<DailyAdviceMeal> = {}): DailyAdviceMeal {
  return {
    eaten_at: `${day}T12:00:00.000+09:00`,
    total_calories: 650,
    protein: 20,
    fat: 20,
    carbs: 80,
    meal_items: [{ name: "定食" }],
    ...overrides,
  };
}

function enoughMeals(): DailyAdviceMeal[] {
  return [
    meal("2026-05-01"),
    meal("2026-05-01", { eaten_at: "2026-05-01T19:00:00.000+09:00" }),
    meal("2026-05-02"),
    meal("2026-05-03"),
    meal("2026-05-04"),
  ];
}

describe("daily advice orchestration", () => {
  it("does not call AI for free users", async () => {
    const generateAdvice = vi.fn().mockResolvedValue(advice);
    const result = await createDailyAdvice({
      plan: "free",
      goalCalories: 2000,
      meals: enoughMeals(),
      generateAdvice,
    });

    expect(result).toEqual({ status: "plan_required" });
    expect(generateAdvice).not.toHaveBeenCalled();
  });

  it("does not call AI when data is insufficient", async () => {
    const generateAdvice = vi.fn().mockResolvedValue(advice);
    const result = await createDailyAdvice({
      plan: "paid",
      goalCalories: 2000,
      meals: [meal("2026-05-04"), meal("2026-05-05")],
      generateAdvice,
    });

    expect(result).toEqual({
      status: "insufficient_data",
      message: INSUFFICIENT_DAILY_ADVICE_MESSAGE,
    });
    expect(generateAdvice).not.toHaveBeenCalled();
  });

  it("calls AI only when paid user has enough data", async () => {
    const generateAdvice = vi.fn().mockResolvedValue(advice);
    const result = await createDailyAdvice({
      plan: "paid",
      goalCalories: 2000,
      meals: enoughMeals(),
      generateAdvice,
    });

    expect(result.status).toBe("ok");
    expect(result).toMatchObject({ advice });
    expect(generateAdvice).toHaveBeenCalledTimes(1);
  });
});

describe("daily advice issue selection", () => {
  it("selects only one issue by priority when multiple conditions match", () => {
    const selected = selectDailyAdviceIssue({
      period: "last_7_days",
      recorded_days: 5,
      meal_count: 10,
      avg_calories: 1200,
      avg_protein: 10,
      avg_fat: 80,
      avg_carbs: 260,
      recent_3_day_avg_calories: 1300,
      calorie_diff_from_7_day_avg: 100,
      pfc_ratio: { protein: 8, fat: 40, carbs: 52 },
      meal_time_ratio: { morning: 10, lunch: 35, night: 55 },
      repeated_meal_names: ["カレー"],
      goal_calories: 2000,
    });

    expect(selected.selected_issue).toBe("calories_too_low");
  });

  it("falls back to consistent_logging when no other issue matches", () => {
    const selected = selectDailyAdviceIssue({
      period: "last_7_days",
      recorded_days: 5,
      meal_count: 12,
      avg_calories: 1900,
      avg_protein: 80,
      avg_fat: 60,
      avg_carbs: 200,
      recent_3_day_avg_calories: 1880,
      calorie_diff_from_7_day_avg: -20,
      pfc_ratio: { protein: 20, fat: 28, carbs: 52 },
      meal_time_ratio: { morning: 30, lunch: 40, night: 30 },
      repeated_meal_names: [],
      goal_calories: 2000,
    });

    expect(selected.selected_issue).toBe("consistent_logging");
    expect(selected.reason).toContain("5日");
    expect(selected.reason).toContain("12件");
  });

  it("builds a concrete summary from recent meals", () => {
    const summary = buildDailyAdviceSummary(enoughMeals(), 2000);

    expect(summary).not.toBeNull();
    expect(summary?.recorded_days).toBe(4);
    expect(summary?.meal_count).toBe(5);
    expect(summary?.selected_issue).toBeTruthy();
  });
});

describe("daily advice prompt", () => {
  it("contains concrete output constraints and NG abstract examples", () => {
    const summary = buildDailyAdviceSummary(enoughMeals(), 2000);
    expect(summary).not.toBeNull();

    const prompt = buildDailyAdvicePrompt(summary!);

    expect(prompt).toContain("抽象表現は禁止");
    expect(prompt).toContain("次の1食で実行できる内容にする");
    expect(prompt).toContain("ユーザーを責めない");
    expect(prompt).toContain("バランスよく食べましょう");
    expect(prompt).toContain("健康的な食事を心がけましょう");
    expect(prompt).toContain("食べすぎに注意しましょう");
    expect(prompt).toContain("The server already selected the issue");
  });
});
