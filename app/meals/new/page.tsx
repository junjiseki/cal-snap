import Link from "next/link";
import { BarChart3, Camera, CheckCircle2, ShieldCheck } from "lucide-react";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { LazyMealPhotoAnalyzer } from "@/components/meals/lazy-meal-photo-analyzer";
import {
  MAX_MEAL_ITEMS_PER_MEAL,
  MAX_MEALS_PER_DAY,
} from "@/lib/meal-analysis";
import { getAuthenticatedUserWithProfileCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewMealPage({
  searchParams,
}: {
  searchParams: Promise<{ manual?: string; date?: string }>;
}) {
  const params = await searchParams;
  const openManual =
    params.manual === "1" ||
    params.manual === "true" ||
    params.manual === "yes";
  const dateParam = params.date;
  const initialEatenAtLocal =
    typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? `${dateParam}T12:00`
      : undefined;

  const { user, profile } = await getAuthenticatedUserWithProfileCached();

  const nextQs = new URLSearchParams();
  if (typeof params.manual === "string" && params.manual !== "") {
    nextQs.set("manual", params.manual);
  }
  if (typeof params.date === "string" && params.date !== "") {
    nextQs.set("date", params.date);
  }
  const nextAfterLogin =
    nextQs.size > 0 ? `/meals/new?${nextQs.toString()}` : "/meals/new";
  const loginHref = `/login?next=${encodeURIComponent(safeInternalPath(nextAfterLogin, "/meals/new"))}`;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <Link
            href={loginHref}
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  const initialPlan: "free" | "paid" =
    profile?.plan === "paid" ? "paid" : "free";

  return (
    <main className="min-h-0 flex-1 bg-background">
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-card to-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <Camera className="size-4" />
                  写真で3秒記録
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
                  食事写真を解析して記録
                </h1>
              </div>
              <Link
                href="/dashboard"
                className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold shadow-sm hover:bg-muted sm:inline-flex sm:w-auto"
              >
                <BarChart3 className="size-4" />
                ダッシュボード
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Camera className="size-4 text-primary" />
                  写真を選ぶ
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  AI推定後に修正して保存できます。
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-primary" />
                  写真は保存しない
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  DBには解析結果と食事データだけ保存します。
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 text-primary" />
                  登録上限
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  有料は1日{MAX_MEALS_PER_DAY}件、1食あたり料理{MAX_MEAL_ITEMS_PER_MEAL}件まで。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <LazyMealPhotoAnalyzer
          initialEntryMode={openManual ? "manual" : undefined}
          initialEatenAtLocal={initialEatenAtLocal}
          plan={initialPlan}
        />
      </div>
    </main>
  );
}
