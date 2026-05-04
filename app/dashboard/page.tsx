import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { getCalorieOverLevel, getDayRangeInJapan } from "@/lib/meal-analysis";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";
import { CalorieGoalOnboardingModal } from "@/components/account/calorie-goal-onboarding-modal";
import { DashboardMealCalendar } from "@/components/meals/dashboard-meal-calendar";
import { MealList } from "@/components/meals/meal-list";
import { CalorieChart } from "@/components/meals/calorie-chart";
import {
  dashboardDateHref,
  dashboardMealsListHref,
  daysInJapanMonth,
  lastNJstDaysAsc,
  pad2,
  toJapanYmd,
} from "@/lib/japan-calendar";
import { DASHBOARD_DAY_MEALS_PAGE_SIZE, parseDashboardMealsPage } from "@/lib/dashboard-meals";
import { getStripeServer } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  memo: string | null;
  meal_items?: {
    id: string;
    name: string;
    estimated_amount: string;
    calories: number;
  }[];
};

/** YYYY-MM-DD を日本語の日付表記に（その日の表示用。正午 JST で解釈） */
function formatJapanDateHeading(ymd: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${ymd}T12:00:00+09:00`));
}

async function syncPlanOnBillingSuccess(sessionId: string, userId: string) {
  const stripe = getStripeServer();
  const supabaseAdmin = getSupabaseAdminClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const referenceUserId = session.client_reference_id;
  if (!referenceUserId || referenceUserId !== userId) {
    return;
  }

  const subscription = session.subscription;
  if (!subscription || typeof subscription === "string") {
    return;
  }

  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  const nextPlan = activeStatuses.has(subscription.status) ? "paid" : "free";
  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      plan: nextPlan,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    billing?: string;
    session_id?: string;
    date?: string;
    meals_page?: string;
  }>;
}) {
  const { supabase, user } = await getAuthenticatedUserCached();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ダッシュボードを表示するにはログインしてください。
          </p>
          <Link
            href="/login?next=/dashboard"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  if (params.billing === "success" && params.session_id) {
    try {
      await syncPlanOnBillingSuccess(params.session_id, user.id);
    } catch (error) {
      console.error("[dashboard] billing success sync failed", error);
    }
  }

  const { date: todayDate } = getDayRangeInJapan();
  const { date, start, end, isToday } = getDayRangeInJapan(params.date);
  const mealsPage = parseDashboardMealsPage(params.meals_page);
  const mealsRangeFrom = (mealsPage - 1) * DASHBOARD_DAY_MEALS_PAGE_SIZE;
  const mealsRangeTo = mealsRangeFrom + DASHBOARD_DAY_MEALS_PAGE_SIZE - 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan,daily_calorie_goal")
    .eq("id", user.id)
    .maybeSingle();

  const isPaid = profile?.plan === "paid";
  if (!isPaid && date !== todayDate) {
    redirect("/dashboard");
  }

  const chart14Days = lastNJstDaysAsc(14, todayDate);
  const last14DaysStart = new Date(`${chart14Days[0]}T00:00:00.000+09:00`).toISOString();

  const [cy, cm] = date.split("-").map(Number);
  const monthStartIso = new Date(`${cy}-${pad2(cm)}-01T00:00:00.000+09:00`).toISOString();
  const dimMonth = daysInJapanMonth(cy, cm);
  const monthEndIso = new Date(`${cy}-${pad2(cm)}-${pad2(dimMonth)}T23:59:59.999+09:00`).toISOString();

  const summaryQuery = supabase
    .rpc("get_daily_meal_summary", {
      p_start: start,
      p_end: end,
    })
    .single();
  const chartMealsQuery = isPaid
    ? supabase
        .from("meals")
        .select("id,eaten_at,total_calories,protein,fat,carbs")
        .eq("user_id", user.id)
        .gte("eaten_at", last14DaysStart)
        .order("eaten_at", { ascending: true })
    : Promise.resolve({
        data: [] as {
          id: string;
          eaten_at: string;
          total_calories: number;
          protein: number;
          fat: number;
          carbs: number;
        }[] | null,
        error: null,
      });
  const mealsQuery = supabase
    .from("meals")
    .select(
      "id,eaten_at,total_calories,protein,fat,carbs,memo,meal_items(id,name,estimated_amount,calories)",
    )
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lte("eaten_at", end)
    .order("eaten_at", { ascending: false })
    .range(mealsRangeFrom, mealsRangeTo);
  const monthMealsQuery = isPaid
    ? supabase
        .from("meals")
        .select("eaten_at")
        .eq("user_id", user.id)
        .gte("eaten_at", monthStartIso)
        .lte("eaten_at", monthEndIso)
    : Promise.resolve({ data: [] as { eaten_at: string }[] | null, error: null });

  const [
    { data: summary, error: summaryError },
    { data: chartMeals, error: chartError },
    { data, error },
    { data: monthMealRows },
  ] = await Promise.all([summaryQuery, chartMealsQuery, mealsQuery, monthMealsQuery]);

  const mealCount = Number(summary?.meal_count ?? 0);

  const datesWithMeals = [...new Set((monthMealRows ?? []).map((row) => toJapanYmd(row.eaten_at)))];
  const meals = (data ?? []) as unknown as MealRow[];
  const total = {
    calories: Number(summary?.calories ?? 0),
    protein: Number(summary?.protein ?? 0),
    fat: Number(summary?.fat ?? 0),
    carbs: Number(summary?.carbs ?? 0),
  };
  const defaultCalorieGoal = 2000;
  const goalCalories = profile?.daily_calorie_goal ?? defaultCalorieGoal;
  const safeGoalCalories = Math.max(goalCalories, 1);
  const dateLabelJa = formatJapanDateHeading(date);
  const calorieDelta = goalCalories - total.calories;
  const calorieRemainOrOver =
    calorieDelta >= 0
      ? `あと ${calorieDelta} kcal`
      : `1日の摂取カロリー（目安）を ${Math.abs(calorieDelta)} kcal 超過`;
  const calorieProgress = Math.min(100, Math.round((total.calories / safeGoalCalories) * 100));
  const overLevel = getCalorieOverLevel(total.calories, goalCalories);
  const shouldShowGoalPrompt = user.user_metadata?.calorie_goal_prompt_dismissed !== true;

  return (
    <main className="min-h-0 flex-1 bg-background">
      <CalorieGoalOnboardingModal
        initialGoal={goalCalories}
        shouldShow={shouldShowGoalPrompt}
      />
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">{dateLabelJa}</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
                  {isToday ? "今日の状態" : "選択日の状態"}
                </h1>
              </div>
              <Link
                href="/meals/new"
                className="hidden h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm sm:inline-flex sm:w-auto"
              >
                <Camera className="size-4" />
                食事を登録
              </Link>
            </div>
            <div className="mt-5 max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">摂取カロリー</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">
                    {total.calories}
                    <span className="ml-1 text-base text-muted-foreground">kcal</span>
                  </p>
                </div>
                <div
                  className={[
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold",
                    overLevel === "none" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
                    overLevel === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
                    overLevel === "severe" && "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {overLevel !== "none" ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {calorieRemainOrOver}
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-muted">
                <div
                  className={[
                    "h-3 rounded-full transition-all",
                    overLevel === "none" && "bg-primary",
                    overLevel === "warn" && "bg-amber-500 dark:bg-amber-400",
                    overLevel === "severe" && "bg-red-500",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                目安 {goalCalories} kcal / {calorieProgress}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-8 sm:py-6">
        {error || summaryError || chartError ? (
          <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            食事データを取得できません。
          </p>
        ) : null}

        <section className="hidden border border-primary/20 bg-primary/5 p-4 sm:block sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">次の食事に迷ったら</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  有料プランでは、過去の食事から外食・自炊・コンビニ向けのメニューを1日3回提案できます。
                </p>
              </div>
            </div>
            <Link
              href="/suggestions"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              食事提案へ
              <Sparkles className="size-4" />
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">PFC 合計</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="PFC合計">
            <div className="border border-border bg-card p-3 sm:p-5">
              <p className="text-sm text-muted-foreground">たんぱく質</p>
              <p className="mt-2 text-xl font-semibold sm:text-3xl">
                {Math.round(total.protein)}
                <span className="ml-0.5 text-sm text-muted-foreground">g</span>
              </p>
            </div>
            <div className="border border-border bg-card p-3 sm:p-5">
              <p className="text-sm text-muted-foreground">脂質</p>
              <p className="mt-2 text-xl font-semibold sm:text-3xl">
                {Math.round(total.fat)}
                <span className="ml-0.5 text-sm text-muted-foreground">g</span>
              </p>
            </div>
            <div className="border border-border bg-card p-3 sm:p-5">
              <p className="text-sm text-muted-foreground">炭水化物</p>
              <p className="mt-2 text-xl font-semibold sm:text-3xl">
                {Math.round(total.carbs)}
                <span className="ml-0.5 text-sm text-muted-foreground">g</span>
              </p>
            </div>
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="text-lg font-semibold sm:text-xl">摂取カロリー・PFC推移</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPaid
                ? "直近14日の日ごとの合計カロリーとPFCです。"
                : "無料プランでは当日の集計のみです。過去の推移は有料プランで表示できます。"}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {!isPaid ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  チャート・過去日の履歴を見るには、有料プランへのアップグレードが必要です。
                </p>
                <Link
                  href="/billing"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
                >
                  料金・プランを見る
                </Link>
              </div>
            ) : (
              <CalorieChart
                meals={(chartMeals ?? []) as MealRow[]}
                goalCalories={goalCalories}
                chartEndDate={todayDate}
              />
            )}
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">食事一覧</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mealCount}件
                {!isPaid ? " · 無料プランは本日のみ" : null}
              </p>
            </div>
            {isPaid && date !== todayDate ? (
              <Link
                href={dashboardDateHref(todayDate)}
                scroll={false}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
              >
                本日へ
              </Link>
            ) : null}
          </div>
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
            <DashboardMealCalendar
              selectedDate={date}
              todayDate={todayDate}
              isPaid={isPaid}
              datesWithMeals={datesWithMeals}
            />
            <MealList
              meals={meals}
              mealsPage={mealsPage}
              mealsPageSize={DASHBOARD_DAY_MEALS_PAGE_SIZE}
              totalMealsForDay={mealCount}
              nextPageHref={
                mealsRangeFrom + meals.length < mealCount
                  ? dashboardMealsListHref(date, mealsPage + 1)
                  : null
              }
              prevPageHref={mealsPage > 1 ? dashboardMealsListHref(date, mealsPage - 1) : null}
              selectedDateYmd={date}
              todayDateYmd={todayDate}
              goalCalories={goalCalories}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
