"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

const CalorieChart = dynamic(
  () =>
    import("@/components/meals/calorie-chart").then(
      (module) => module.CalorieChart,
    ),
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

function ChartPlaceholder() {
  return (
    <div
      className="min-h-112 rounded-md bg-muted/15"
      aria-busy="true"
      aria-label="グラフは表示エリアに入ると読み込まれます"
    />
  );
}

export function LazyCalorieChart({
  meals,
  goalCalories,
  chartEndDate,
}: {
  meals: MealRow[];
  goalCalories: number;
  chartEndDate: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [shouldMountChart, setShouldMountChart] = useState(false);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMountChart(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px", threshold: 0.01 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef}>
      {shouldMountChart ? (
        <CalorieChart
          meals={meals}
          goalCalories={goalCalories}
          chartEndDate={chartEndDate}
        />
      ) : (
        <ChartPlaceholder />
      )}
    </div>
  );
}
