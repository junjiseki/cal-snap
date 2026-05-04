import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { MealPhotoAnalyzer } from "@/components/meals/meal-photo-analyzer";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewMealPage({
  searchParams,
}: {
  searchParams: Promise<{ manual?: string; date?: string }>;
}) {
  const params = await searchParams;
  const openManual =
    params.manual === "1" || params.manual === "true" || params.manual === "yes";
  const dateParam = params.date;
  const initialEatenAtLocal =
    typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? `${dateParam}T12:00`
      : undefined;

  const { supabase, user } = await getAuthenticatedUserCached();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const plan = profile?.plan === "paid" ? "paid" : "free";
  const canUseManualEntry = plan === "paid";

  return (
    <main className="min-h-0 flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">写真で3秒記録</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
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
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              {plan === "paid"
                ? "写真解析または手入力で記録できます。推定値は保存前に確認・修正できます。"
                : "無料プランでは写真解析で記録できます。推定値は保存前に確認・修正できます。手入力での記録は有料プランで利用できます。"}
            </p>
            {plan === "paid" ? (
              <p className="mt-2 text-xs text-muted-foreground/75">
                登録上限: 1日8件まで / 1食あたり料理14件まで
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <MealPhotoAnalyzer
          initialEntryMode={openManual && canUseManualEntry ? "manual" : undefined}
          initialEatenAtLocal={initialEatenAtLocal}
          plan={plan}
        />
      </div>
    </main>
  );
}
