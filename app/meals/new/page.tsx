import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { MealPhotoAnalyzer } from "@/components/meals/meal-photo-analyzer";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const { user } = await getAuthenticatedUserCached();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <Link
            href="/login?next=/meals/new"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-0 flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">食事を記録</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
                  食事を記録
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
              写真のAI解析でも、数値の手入力でも記録できます。解析回数に達した場合は手入力をご利用ください。
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <MealPhotoAnalyzer />
      </div>
    </main>
  );
}
