import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellRing,
  Camera,
  CalendarDays,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getCalorieOverLevel, getDayRangeInJapan } from "@/lib/meal-analysis";
import { getAuthenticatedUserWithProfileCached } from "@/lib/supabase/server";
import {
  DynamicCalorieChart,
  DynamicCalorieGoalModal,
  DynamicMealCalendar,
  DynamicMealList,
} from "@/components/meals/dashboard-client-dynamic";
import {
  dashboardDateHref,
  dashboardMealsListHref,
  lastNJstDaysAsc,
  pad2,
  toJapanYmd,
} from "@/lib/japan-calendar";
import {
  DASHBOARD_DAY_MEALS_PAGE_SIZE,
  parseDashboardMealsPage,
} from "@/lib/dashboard-meals";
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

type DashboardSupabaseClient = Awaited<
  ReturnType<typeof getAuthenticatedUserWithProfileCached>
>["supabase"];

type DailySummaryRow = {
  meal_count: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

function isNextNavigationError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

async function fetchDailySummary(
  supabase: DashboardSupabaseClient,
  start: string,
  endExclusive: string,
): Promise<{ data: DailySummaryRow | null; error: unknown | null }> {
  try {
    const { data, error } = await supabase
      .rpc("get_daily_meal_summary", {
        p_start: start,
        p_end: endExclusive,
      })
      .single();

    if (!error && data) {
      return {
        data: {
          meal_count: Number(data.meal_count ?? 0),
          calories: Number(data.calories ?? 0),
          protein: Number(data.protein ?? 0),
          fat: Number(data.fat ?? 0),
          carbs: Number(data.carbs ?? 0),
        },
        error: null,
      };
    }

    console.warn(
      "[dashboard] get_daily_meal_summary failed, falling back",
      error,
    );

    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select("total_calories, protein, fat, carbs")
      .gte("eaten_at", start)
      .lt("eaten_at", endExclusive);

    if (mealsError) {
      return { data: null, error: mealsError };
    }

    const rows = meals ?? [];
    return {
      data: {
        meal_count: rows.length,
        calories: rows.reduce((sum, row) => sum + row.total_calories, 0),
        protein: rows.reduce((sum, row) => sum + Number(row.protein), 0),
        fat: rows.reduce((sum, row) => sum + Number(row.fat), 0),
        carbs: rows.reduce((sum, row) => sum + Number(row.carbs), 0),
      },
      error: null,
    };
  } catch (error) {
    console.error("[dashboard] fetchDailySummary threw", error);
    return { data: null, error };
  }
}

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
  const { supabase, user, profile } =
    await getAuthenticatedUserWithProfileCached();

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
      // 同期直後の RSC 内 profile とズレないよう、クエリなしで再読込させる
      redirect("/dashboard");
    } catch (error) {
      if (isNextNavigationError(error)) throw error;
      console.error("[dashboard] billing success sync failed", error);
    }
  }

  const { date: todayDate } = getDayRangeInJapan();
  const { date, start, endExclusive } = getDayRangeInJapan(params.date);
  const requestedMealsPage = parseDashboardMealsPage(params.meals_page);

  const isPaid = profile?.plan === "paid";
  if (!isPaid && date !== todayDate) {
    redirect("/dashboard");
  }

  const { data: summary, error: summaryError } = await fetchDailySummary(
    supabase,
    start,
    endExclusive,
  );

  const mealCount = Number(summary?.meal_count ?? 0);
  const totalMealsPages = Math.max(
    1,
    Math.ceil(mealCount / DASHBOARD_DAY_MEALS_PAGE_SIZE),
  );
  const mealsPage = Math.min(requestedMealsPage, totalMealsPages);
  if (requestedMealsPage !== mealsPage) {
    redirect(dashboardMealsListHref(date, mealsPage));
  }

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
  const calorieProgress = Math.min(
    100,
    Math.round((total.calories / safeGoalCalories) * 100),
  );
  const overLevel = getCalorieOverLevel(total.calories, goalCalories);
  const shouldShowGoalPrompt =
    user.user_metadata?.calorie_goal_prompt_dismissed !== true;

  const mealsRangeFrom = (mealsPage - 1) * DASHBOARD_DAY_MEALS_PAGE_SIZE;
  const mealsRangeTo = mealsRangeFrom + DASHBOARD_DAY_MEALS_PAGE_SIZE - 1;
  const [cy, cm] = date.split("-").map(Number);
  const monthStartIso = new Date(
    `${cy}-${pad2(cm)}-01T00:00:00.000+09:00`,
  ).toISOString();
  let nextMonthYear = cy;
  let nextMonth = cm + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextMonthYear += 1;
  }
  const monthEndExclusive = new Date(
    `${nextMonthYear}-${pad2(nextMonth)}-01T00:00:00.000+09:00`,
  ).toISOString();
  const chart14Days = lastNJstDaysAsc(14, todayDate);
  const last14DaysStart = new Date(
    `${chart14Days[0]}T00:00:00.000+09:00`,
  ).toISOString();

  let chartMeals: MealRow[] | null = null;
  let chartError: unknown = null;
  let meals: MealRow[] = [];
  let mealsError: unknown = null;
  let datesWithMeals: string[] = [];

  try {
    const chartQuery = isPaid
      ? supabase
          .from("meals")
          .select("id,eaten_at,total_calories,protein,fat,carbs")
          .eq("user_id", user.id)
          .gte("eaten_at", last14DaysStart)
          .order("eaten_at", { ascending: true })
      : Promise.resolve({
          data: null as MealRow[] | null,
          error: null as unknown,
        });
    const mealsQuery = supabase
      .from("meals")
      .select(
        "id,eaten_at,total_calories,protein,fat,carbs,memo,meal_items(id,name,estimated_amount,calories)",
      )
      .eq("user_id", user.id)
      .gte("eaten_at", start)
      .lt("eaten_at", endExclusive)
      .order("eaten_at", { ascending: false })
      .range(mealsRangeFrom, mealsRangeTo);
    const monthMealsQuery = isPaid
      ? supabase
          .from("meals")
          .select("eaten_at")
          .eq("user_id", user.id)
          .gte("eaten_at", monthStartIso)
          .lt("eaten_at", monthEndExclusive)
      : Promise.resolve({
          data: [] as { eaten_at: string }[] | null,
          error: null as unknown,
        });

    const [chartResult, mealsResult, monthResult] = await Promise.all([
      chartQuery,
      mealsQuery,
      monthMealsQuery,
    ]);

    if (chartResult.error) {
      chartError = chartResult.error;
    } else if (chartResult.data) {
      chartMeals = chartResult.data as MealRow[];
    }

    if (mealsResult.error) {
      mealsError = mealsResult.error;
    } else {
      meals = (mealsResult.data ?? []) as unknown as MealRow[];
    }

    datesWithMeals = [
      ...new Set(
        (monthResult.data ?? []).map((row) => toJapanYmd(row.eaten_at)),
      ),
    ];
  } catch (error) {
    if (isNextNavigationError(error)) throw error;
    console.error("[dashboard] parallel fetch threw", error);
    mealsError = error;
  }

  return (
    <main className="min-h-0 flex-1 bg-background">
      {shouldShowGoalPrompt ? (
        <DynamicCalorieGoalModal
          initialGoal={goalCalories}
          shouldShow={shouldShowGoalPrompt}
        />
      ) : null}
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-card to-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {dateLabelJa}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
                  今日の食事バランス
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
            <div className="mt-5 rounded-xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur sm:max-w-3xl sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">摂取カロリー</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">
                    {total.calories}
                    <span className="ml-1 text-base text-muted-foreground">
                      kcal
                    </span>
                  </p>
                </div>
                <div
                  className={[
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold",
                    overLevel === "none" &&
                      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
                    overLevel === "warn" &&
                      "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
                    overLevel === "severe" &&
                      "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
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
            <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3">
              <Link
                href="/meals/new"
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="size-4" />
                </span>
                <p className="mt-3 text-sm font-semibold">食事を記録</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  写真解析または手入力で追加
                </p>
              </Link>
              <Link
                href="/suggestions"
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <p className="mt-3 text-sm font-semibold">次の食事を相談</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  過去の傾向から候補を作成
                </p>
              </Link>
              <Link
                href="/meal-reminders"
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BellRing className="size-4" />
                </span>
                <p className="mt-3 text-sm font-semibold">通知時間を設定</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  記録忘れを防ぐリマインド
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-8 sm:py-6">
        {summaryError ? (
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">PFC 合計</h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {date === todayDate ? "今日" : date}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="PFC合計">
            {[
              {
                label: "たんぱく質",
                value: Math.round(total.protein),
                tone: "border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/20",
              },
              {
                label: "脂質",
                value: Math.round(total.fat),
                tone: "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20",
              },
              {
                label: "炭水化物",
                value: Math.round(total.carbs),
                tone: "border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
              },
            ].map(({ label, value, tone }) => (
              <div
                key={label}
                className={[
                  "rounded-xl border border-l-4 border-border p-3 shadow-sm sm:p-5",
                  tone,
                ].join(" ")}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold sm:text-3xl">
                  {value}
                  <span className="ml-0.5 text-sm text-muted-foreground">
                    g
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="text-lg font-semibold sm:text-xl">
              摂取カロリー・PFC推移
            </h2>
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
            ) : chartError ? (
              <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                推移データを取得できません。
              </p>
            ) : (
              <DynamicCalorieChart
                meals={chartMeals ?? []}
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
                {mealCount}件{!isPaid ? " · 無料プランは本日のみ" : null}
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
          {mealsError ? (
            <div className="p-4 sm:p-5">
              <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                食事一覧を取得できません。
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,17.5rem)_1fr] lg:items-start">
              <DynamicMealCalendar
                selectedDate={date}
                todayDate={todayDate}
                isPaid={isPaid}
                datesWithMeals={datesWithMeals}
              />
              <DynamicMealList
                meals={meals}
                mealsPage={mealsPage}
                mealsPageSize={DASHBOARD_DAY_MEALS_PAGE_SIZE}
                totalMealsForDay={mealCount}
                nextPageHref={
                  mealsRangeFrom + meals.length < mealCount
                    ? dashboardMealsListHref(date, mealsPage + 1)
                    : null
                }
                prevPageHref={
                  mealsPage > 1
                    ? dashboardMealsListHref(date, mealsPage - 1)
                    : null
                }
                selectedDateYmd={date}
                todayDateYmd={todayDate}
                goalCalories={goalCalories}
                isPaid={isPaid}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
