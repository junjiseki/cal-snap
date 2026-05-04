import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { DisplayNameForm } from "@/components/account/display-name-form";
import { CalorieGoalForm } from "@/components/meals/calorie-goal-form";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user } = await getAuthenticatedUserCached();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            プロフィール編集にはログインが必要です。
          </p>
          <Link
            href="/login?next=/profile"
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
    .select("daily_calorie_goal,plan")
    .eq("id", user.id)
    .single();

  const goalCalories = profile?.daily_calorie_goal ?? 2000;
  const displayName =
    typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  const avatarLabel = displayName.trim().slice(0, 1);

  return (
    <main className="min-h-0 flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-8 sm:py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            ダッシュボード
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              {avatarLabel || <User className="size-5" />}
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">プロフィール</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                プロフィール編集
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <section id="calorie-goal" className="border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">1日の摂取カロリー</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ダッシュボードの目安線と進捗バーに反映されます。
          </p>
          <div className="mt-4">
            <CalorieGoalForm key={goalCalories} initialGoal={goalCalories} />
          </div>
        </section>

        <section className="border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">表示名</h2>
          <div className="mt-4">
            <DisplayNameForm initialName={displayName} />
          </div>
        </section>

        <section className="border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">基本情報</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">メールアドレス</dt>
              <dd className="mt-1 font-medium">{user.email ?? "（メール未設定）"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">プラン</dt>
              <dd className="mt-1 font-medium">{profile?.plan === "paid" ? "有料" : "無料"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
