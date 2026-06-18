"use client";

import Link from "next/link";
import { CalorieGoalOnboardingModal } from "@/components/account/calorie-goal-onboarding-modal";
import { DashboardSectionErrorBoundary } from "@/components/dashboard/section-error-boundary";
import { DashboardMealCalendar } from "@/components/meals/dashboard-meal-calendar";
import { LazyCalorieChart } from "@/components/meals/lazy-calorie-chart";
import { MealList } from "@/components/meals/meal-list";

type ChartMeal = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type MealRow = ChartMeal & {
  memo: string | null;
  meal_items?: {
    id: string;
    name: string;
    estimated_amount: string;
    calories: number;
  }[];
};

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
  selectedDate,
  todayDate,
  isPaid,
  datesWithMeals,
  meals,
  mealsPage,
  mealsPageSize,
  totalMealsForDay,
  nextPageHref,
  prevPageHref,
  goalCalories,
}: {
  selectedDate: string;
  todayDate: string;
  isPaid: boolean;
  datesWithMeals: string[];
  meals: MealRow[];
  mealsPage: number;
  mealsPageSize: number;
  totalMealsForDay: number;
  nextPageHref: string | null;
  prevPageHref: string | null;
  goalCalories: number;
}) {
  return (
    <DashboardSectionErrorBoundary
      label="meal-list"
      fallback={
        <div className="p-4 sm:p-5">
          {sectionFallback("食事一覧を読み込めませんでした。")}
          <Link
            href="/meals/new"
            className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            食事を記録する
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
        <DashboardMealCalendar
          selectedDate={selectedDate}
          todayDate={todayDate}
          isPaid={isPaid}
          datesWithMeals={datesWithMeals}
        />
        <MealList
          meals={meals}
          mealsPage={mealsPage}
          mealsPageSize={mealsPageSize}
          totalMealsForDay={totalMealsForDay}
          nextPageHref={nextPageHref}
          prevPageHref={prevPageHref}
          selectedDateYmd={selectedDate}
          todayDateYmd={todayDate}
          goalCalories={goalCalories}
          isPaid={isPaid}
        />
      </div>
    </DashboardSectionErrorBoundary>
  );
}
