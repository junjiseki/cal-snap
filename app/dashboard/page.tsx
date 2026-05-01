import Link from "next/link";
import { Camera, TrendingDown, TrendingUp } from "lucide-react";
import { getDayRangeInJapan } from "@/lib/meal-analysis";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { MealList } from "@/components/meals/meal-list";
import { CalorieGoalForm } from "@/components/meals/calorie-goal-form";
import { CalorieChart } from "@/components/meals/calorie-chart";
import { getStripeServer } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const MEALS_PAGE_SIZE = 5;

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ai_confidence: number;
  memo: string | null;
  meal_items?: {
    id: string;
    name: string;
    estimated_amount: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    confidence: number;
  }[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD（日本の暦）を diffDays だけずらす。UTC の日付と混ぜない（前日が二日分ずれる原因になる） */
function shiftJapanDate(date: string, diffDays: number) {
  const base = new Date(`${date}T12:00:00+09:00`);
  const shifted = new Date(base.getTime() + diffDays * MS_PER_DAY);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
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

function parsePositivePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function dashboardHref(date: string, page = 1) {
  const params = new URLSearchParams({ date });
  if (page > 1) {
    params.set("page", String(page));
  }
  return `/dashboard?${params.toString()}`;
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
  searchParams: Promise<{ billing?: string; session_id?: string; date?: string; page?: string }>;
}) {
  const { supabase, user } = await getAuthenticatedUser();

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

  const { date, start, end, isToday } = getDayRangeInJapan(params.date);
  const { date: todayDate } = getDayRangeInJapan();
  const prevDate = shiftJapanDate(date, -1);
  const nextDate = shiftJapanDate(date, 1);
  const requestedPage = parsePositivePage(params.page);
  const last14DaysStart = new Date();
  last14DaysStart.setDate(last14DaysStart.getDate() - 13);
  last14DaysStart.setHours(0, 0, 0, 0);
  // TODO: Replace this mock billing state with Stripe webhook-driven profile updates.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan,daily_calorie_goal")
    .eq("id", user.id)
    .maybeSingle();
  const { data: totalMeals, error: totalError } = await supabase
    .from("meals")
    .select("total_calories,protein,fat,carbs")
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lte("eaten_at", end);
  const mealCount = totalMeals?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(mealCount / MEALS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const rangeFrom = (currentPage - 1) * MEALS_PAGE_SIZE;
  const rangeTo = rangeFrom + MEALS_PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from("meals")
    .select(
      "id,eaten_at,total_calories,protein,fat,carbs,ai_confidence,memo,meal_items(id,name,estimated_amount,calories,protein,fat,carbs,confidence)",
    )
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lte("eaten_at", end)
    .order("eaten_at", { ascending: false })
    .range(rangeFrom, rangeTo);
  const { data: chartMeals, error: chartError } = await supabase
    .from("meals")
    .select("id,eaten_at,total_calories")
    .eq("user_id", user.id)
    .gte("eaten_at", last14DaysStart.toISOString())
    .order("eaten_at", { ascending: true });

  const meals = (data ?? []) as unknown as MealRow[];
  const total = (totalMeals ?? []).reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.total_calories,
      protein: sum.protein + Number(meal.protein),
      fat: sum.fat + Number(meal.fat),
      carbs: sum.carbs + Number(meal.carbs),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
  const pageStart = mealCount === 0 ? 0 : rangeFrom + 1;
  const pageEnd = Math.min(rangeTo + 1, mealCount);
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const windowStart = Math.min(
        Math.max(currentPage - 2, 1),
        Math.max(totalPages - 4, 1),
      );
      return windowStart + index;
    },
  );

  const goalCalories = profile?.daily_calorie_goal ?? 2000;
  const safeGoalCalories = Math.max(goalCalories, 1);
  const dateLabelJa = formatJapanDateHeading(date);
  const calorieDelta = goalCalories - total.calories;
  const calorieRemainOrOver =
    calorieDelta >= 0
      ? `あと ${calorieDelta} kcal`
      : `1日の摂取カロリー（目安）を ${Math.abs(calorieDelta)} kcal 超過`;
  const calorieProgress = Math.min(100, Math.round((total.calories / safeGoalCalories) * 100));
  const isOverGoal = calorieDelta < 0;

  return (
    <main className="min-h-0 flex-1 bg-background">
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm sm:w-auto"
              >
                <Camera className="size-4" />
                食事写真を登録
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
                    isOverGoal
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700",
                  ].join(" ")}
                >
                  {isOverGoal ? (
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
                    isOverGoal ? "bg-red-500" : "bg-primary",
                  ].join(" ")}
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
        {error || totalError || chartError ? (
          <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            食事データを取得できません。
          </p>
        ) : null}

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">PFC 合計</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="border border-border bg-card p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">たんぱく質</p>
              <p className="mt-2 text-2xl font-semibold sm:text-3xl">{total.protein.toFixed(1)} g</p>
            </div>
            <div className="border border-border bg-card p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">脂質</p>
              <p className="mt-2 text-2xl font-semibold sm:text-3xl">{total.fat.toFixed(1)} g</p>
            </div>
            <div className="border border-border bg-card p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">炭水化物</p>
              <p className="mt-2 text-2xl font-semibold sm:text-3xl">{total.carbs.toFixed(1)} g</p>
            </div>
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="border-b border-border p-4 sm:p-5">
            <h2 className="text-lg font-semibold sm:text-xl">摂取カロリー推移</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              直近14日の日ごとの合計カロリーです。
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {(chartMeals ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                データがまだないため、グラフは表示されません。
              </p>
            ) : (
              <CalorieChart
                meals={(chartMeals ?? []) as MealRow[]}
                goalCalories={goalCalories}
              />
            )}
          </div>
        </section>

        <section className="border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <h2 className="text-lg font-semibold sm:text-xl">食事一覧</h2>
            <div className="flex items-center gap-2">
              <Link
                href={dashboardHref(prevDate)}
                scroll={false}
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
              >
                ←
              </Link>
              <Link
                href={dashboardHref(todayDate)}
                scroll={false}
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
              >
                本日
              </Link>
              <Link
                href={dashboardHref(nextDate)}
                scroll={false}
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
              >
                →
              </Link>
            </div>
          </div>
          <MealList meals={meals} />
          {mealCount > MEALS_PAGE_SIZE ? (
            <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-sm text-muted-foreground">
                {pageStart}-{pageEnd} / {mealCount}件
              </p>
              <nav className="flex items-center gap-1" aria-label="食事一覧ページネーション">
                {currentPage > 1 ? (
                  <Link
                    href={dashboardHref(date, currentPage - 1)}
                    scroll={false}
                    className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
                  >
                    前へ
                  </Link>
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-muted-foreground opacity-50">
                    前へ
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {visiblePages.map((page) => (
                    <Link
                      key={page}
                      href={dashboardHref(date, page)}
                      scroll={false}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={[
                        "inline-flex size-9 items-center justify-center rounded-md border text-sm font-semibold",
                        page === currentPage
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted",
                      ].join(" ")}
                    >
                      {page}
                    </Link>
                  ))}
                </div>
                {currentPage < totalPages ? (
                  <Link
                    href={dashboardHref(date, currentPage + 1)}
                    scroll={false}
                    className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
                  >
                    次へ
                  </Link>
                ) : (
                  <span className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-muted-foreground opacity-50">
                    次へ
                  </span>
                )}
              </nav>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
