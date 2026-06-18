"use client";

import dynamic from "next/dynamic";

const mealListLoading = (
  <div className="space-y-3">
    <div className="h-24 animate-pulse rounded-md bg-muted/20" />
    <div className="h-24 animate-pulse rounded-md bg-muted/20" />
  </div>
);

export const DynamicMealList = dynamic(
  () => import("@/components/meals/meal-list").then((m) => m.MealList),
  { ssr: false, loading: () => mealListLoading },
);

export const DynamicMealCalendar = dynamic(
  () =>
    import("@/components/meals/dashboard-meal-calendar").then(
      (m) => m.DashboardMealCalendar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="hidden h-80 animate-pulse bg-muted/20 lg:block" />
    ),
  },
);

export const DynamicCalorieChart = dynamic(
  () =>
    import("@/components/meals/lazy-calorie-chart").then(
      (m) => m.LazyCalorieChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-112 animate-pulse rounded-md bg-muted/20"
        aria-busy="true"
        aria-label="グラフを読み込み中"
      />
    ),
  },
);

export const DynamicCalorieGoalModal = dynamic(
  () =>
    import("@/components/account/calorie-goal-onboarding-modal").then(
      (m) => m.CalorieGoalOnboardingModal,
    ),
  { ssr: false },
);
