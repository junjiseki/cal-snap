"use client";

import type { ComponentProps, ReactNode } from "react";
import { CalorieGoalOnboardingModal } from "@/components/account/calorie-goal-onboarding-modal";
import { DashboardMealListClient } from "@/components/dashboard/dashboard-meal-list-client";
import { DashboardSectionErrorBoundary } from "@/components/dashboard/section-error-boundary";
import { DashboardMealCalendar } from "@/components/meals/dashboard-meal-calendar";
import { LazyCalorieChart } from "@/components/meals/lazy-calorie-chart";
import type { MealListShell } from "@/components/meals/meal-list-shell";

type MealListShellProps = ComponentProps<typeof MealListShell>;

function sectionFallback(message: string) {
  return (
    <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

export function DashboardGoalModalBlock({
  initialGoal,
  shouldShow,
}: {
  initialGoal: number;
  shouldShow: boolean;
}) {
  if (!shouldShow) return null;

  return (
    <DashboardSectionErrorBoundary fallback={null} label="goal-modal">
      <CalorieGoalOnboardingModal
        initialGoal={initialGoal}
        shouldShow={shouldShow}
      />
    </DashboardSectionErrorBoundary>
  );
}

type ChartMeal = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function DashboardChartBlock({
  meals,
  goalCalories,
  chartEndDate,
}: {
  meals: ChartMeal[];
  goalCalories: number;
  chartEndDate: string;
}) {
  return (
    <DashboardSectionErrorBoundary
      label="calorie-chart"
      fallback={sectionFallback("グラフを読み込めませんでした。")}
    >
      <LazyCalorieChart
        meals={meals}
        goalCalories={goalCalories}
        chartEndDate={chartEndDate}
      />
    </DashboardSectionErrorBoundary>
  );
}

export function DashboardMealsBlock({
  shell,
  datesWithMeals,
  ...mealListProps
}: MealListShellProps & {
  shell: React.ReactNode;
  datesWithMeals: string[];
}) {
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
      <DashboardSectionErrorBoundary
        label="meal-calendar"
        fallback={
          <p className="text-sm text-muted-foreground">
            カレンダーを読み込めませんでした。
          </p>
        }
      >
        <DashboardMealCalendar
          selectedDate={mealListProps.selectedDateYmd}
          todayDate={mealListProps.todayDateYmd}
          isPaid={mealListProps.isPaid}
          datesWithMeals={datesWithMeals}
        />
      </DashboardSectionErrorBoundary>
      <DashboardMealListClient shell={shell} {...mealListProps} />
    </div>
  );
}
