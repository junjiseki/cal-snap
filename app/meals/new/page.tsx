import Link from "next/link";
import { MealPhotoAnalyzer } from "@/components/meals/meal-photo-analyzer";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            食事写真の解析と登録には Supabase Auth のログインが必要です。
          </p>
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
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <p className="text-sm font-semibold text-primary">写真から記録</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
            食事を記録
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            写真を選び、推定値を確認して保存します。
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
        <MealPhotoAnalyzer />
      </div>
    </main>
  );
}
