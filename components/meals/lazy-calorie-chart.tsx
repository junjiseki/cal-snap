"use client";

import dynamic from "next/dynamic";

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

const CalorieChart = dynamic(
  () => import("@/components/meals/calorie-chart").then((module) => module.CalorieChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-112 rounded-md bg-muted/15"
        aria-busy="true"
        aria-label="グラフを読み込み中"
      />
    ),
  },
);

export function LazyCalorieChart({
  meals,
  goalCalories,
  chartEndDate,
}: {
  meals: MealRow[];
  goalCalories: number;
  chartEndDate: string;
}) {
  return (
    <CalorieChart
      meals={meals}
      goalCalories={goalCalories}
      chartEndDate={chartEndDate}
    />
  );
}
