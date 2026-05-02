import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { ManageSubscriptionButton } from "@/components/meals/manage-subscription-button";
import { UpgradePlanButton } from "@/components/meals/upgrade-plan-button";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            プランの変更にはログインが必要です。
          </p>
          <Link
            href="/login?next=/billing"
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
    .single();

  const isPaid = profile?.plan === "paid";

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
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">プラン</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {isPaid ? "プラン管理" : "アップグレードプラン"}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
        <section className="border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">現在のプラン</p>
          <p className="mt-2 text-2xl font-semibold">{isPaid ? "有料" : "無料"}</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            無料プランは1日{FREE_DAILY_ANALYSIS_LIMIT}回、有料プランは1日
            {PAID_DAILY_ANALYSIS_LIMIT}回までAI解析できます。
          </p>
        </section>

        <section className="border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">{isPaid ? "サブスク管理" : "有料プラン"}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {isPaid
              ? "支払い方法や請求履歴、解約はStripeの管理画面で確認できます。"
              : "解析回数を増やしたい場合は、有料プランへ切り替えできます。"}
          </p>
          <div className="mt-4">{isPaid ? <ManageSubscriptionButton /> : <UpgradePlanButton />}</div>
          {isPaid ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              アカウントを削除（利用停止）する前に、必ず上記からサブスクリプションを解約してください。削除だけでは Stripe の課金は止まりません。
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
