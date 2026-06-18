"use client";

import type { ComponentProps } from "react";
import { CalorieGoalOnboardingModal } from "@/components/account/calorie-goal-onboarding-modal";
import { DashboardMealCalendarClient } from "@/components/dashboard/dashboard-meal-calendar-client";
import { DashboardMealListClient } from "@/components/dashboard/dashboard-meal-list-client";
import { DashboardSectionErrorBoundary } from "@/components/dashboard/section-error-boundary";
import { LazyCalorieChart } from "@/components/meals/lazy-calorie-chart";
import type { DashboardMealCalendarShell } from "@/components/meals/dashboard-meal-calendar-shell";
import type { MealListShell } from "@/components/meals/meal-list-shell";

type MealListShellProps = ComponentProps<typeof MealListShell>;
type CalendarShellProps = ComponentProps<typeof DashboardMealCalendarShell>;

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
  calendarShell,
  datesWithMeals,
  ...mealListProps
}: MealListShellProps & {
  shell: React.ReactNode;
  calendarShell: React.ReactNode;
  datesWithMeals: string[];
}) {
  const calendarProps: CalendarShellProps = {
    selectedDate: mealListProps.selectedDateYmd,
    todayDate: mealListProps.todayDateYmd,
    isPaid: mealListProps.isPaid,
    datesWithMeals,
  };

  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
      <DashboardMealCalendarClient shell={calendarShell} {...calendarProps} />
      <DashboardMealListClient shell={shell} {...mealListProps} />
    </div>
  );
}
