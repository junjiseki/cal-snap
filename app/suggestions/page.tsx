import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { UpgradePlanButton } from "@/components/meals/upgrade-plan-button";
import { MealSuggestionPlanner } from "@/components/meals/meal-suggestion-planner";
import {
  MEAL_SUGGESTION_DAILY_LIMIT,
  getTodaySuggestionUsageRange,
} from "@/lib/meal-suggestions";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            食事メニュー提案を利用するにはログインしてください。
          </p>
          <Link
            href="/login?next=/suggestions"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const isPaid = profile?.plan === "paid";
  const { start, end } = getTodaySuggestionUsageRange();
  const { count } = isPaid
    ? await supabase
        .from("meal_suggestion_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("success", true)
        .gte("suggested_at", start)
        .lte("suggested_at", end)
    : { count: 0 };

  return (
    <main className="min-h-0 flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            ダッシュボード
          </Link>
          <div className="mt-5 flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">食事提案</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">
                過去の食事から、次のメニューを決める。
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                外食・自炊・コンビニと、朝ご飯・昼食・夜ご飯を選ぶと、AIが過去の食事傾向から候補を提案します。
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        {isPaid ? (
          <MealSuggestionPlanner
            initialUsage={{
              used: count ?? 0,
              limit: MEAL_SUGGESTION_DAILY_LIMIT,
            }}
          />
        ) : (
          <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="border border-border bg-card p-5 sm:p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LockKeyhole className="size-5" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold">有料プラン限定機能です</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                食事メニュー提案は有料プランで1日{MEAL_SUGGESTION_DAILY_LIMIT}
                回まで利用できます。写真解析で登録した過去の食事をもとに、次の食事候補を作ります。
              </p>
            </div>
            <div className="border-2 border-primary bg-card p-5 sm:p-6">
              <p className="text-sm font-semibold text-primary">有料プラン</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                550円
                <span className="ml-1 text-sm text-muted-foreground">/ 月</span>
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                AI写真解析に加えて、食事提案も1日3回使えます。
              </p>
              <div className="mt-5">
                <UpgradePlanButton />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
