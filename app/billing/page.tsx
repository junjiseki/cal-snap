import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ManageSubscriptionButton } from "@/components/meals/manage-subscription-button";
import { UpgradePlanButton } from "@/components/meals/upgrade-plan-button";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";
import { MEAL_SUGGESTION_DAILY_LIMIT } from "@/lib/meal-suggestions";

export const dynamic = "force-dynamic";
const PAID_PLAN_PRICE_LABEL = "550円";

const paidBenefits = [
  {
    icon: Camera,
    title: "AI解析が1日3回",
    body: "朝・昼・夜の食事写真をその日のうちに記録しやすくなります。",
  },
  {
    icon: Sparkles,
    title: "食事提案が1日3回",
    body: "過去の食事から、外食・自炊・コンビニ向けのメニュー候補を作れます。",
  },
  {
    icon: ShieldCheck,
    title: "写真は保存しない",
    body: "解析時だけ画像を扱い、DBには確認後の数値とメモだけを残します。",
  },
] as const;

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
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-8 sm:py-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            ダッシュボード
          </Link>
          <div className="mt-6 flex items-start gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">プラン</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">
                {isPaid ? "有料プランを管理" : "食事管理を、日常に。"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {isPaid
                  ? "支払い方法、請求履歴、解約はStripeの管理画面から確認できます。"
                  : `月額${PAID_PLAN_PRICE_LABEL}でAI解析枠を1日${PAID_DAILY_ANALYSIS_LIMIT}回、食事提案を1日${MEAL_SUGGESTION_DAILY_LIMIT}回利用できます。記録と次の食事決めを軽くします。`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">現在のプラン</p>
            <p className="mt-2 text-2xl font-semibold">{isPaid ? "有料" : "無料"}</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              無料プランは1日{FREE_DAILY_ANALYSIS_LIMIT}回までAI解析できます。
            </p>
          </div>

          <div className="border-2 border-primary bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">有料プラン</p>
                <div className="mt-2 flex items-end gap-1">
                  <p className="text-4xl font-semibold tracking-tight">{PAID_PLAN_PRICE_LABEL}</p>
                  <p className="pb-1 text-sm text-muted-foreground">/ 月</p>
                </div>
              </div>
              <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                おすすめ
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              1日{PAID_DAILY_ANALYSIS_LIMIT}回までAI解析。さらに過去の食事から、次のメニュー提案を1日{MEAL_SUGGESTION_DAILY_LIMIT}回使えます。
            </p>
            <div className="mt-5">
              {isPaid ? <ManageSubscriptionButton /> : <UpgradePlanButton />}
            </div>
            {isPaid ? (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                アカウント削除時には Stripe のサブスクリプションも自動解約されます。上記は請求履歴の確認や、解約に失敗した場合の手動対応用です。
              </p>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                いつでも「サブスクの管理・解約」から操作可能です。
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {paidBenefits.map(({ icon: Icon, title, body }) => (
            <article key={title} className="border border-border bg-card p-4">
              <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="border border-border bg-card p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">食事メニュー提案</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                過去の食事から、次に食べる候補を作成。
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                外食・自炊・コンビニと、朝ご飯・昼食・夜ご飯を選ぶだけで、AIが過去の食事傾向をもとにメニューを提案します。有料プランでは1日{MEAL_SUGGESTION_DAILY_LIMIT}回まで利用できます。
              </p>
            </div>
            <Link
              href="/suggestions"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              食事提案を見る
              <Sparkles className="size-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-semibold">1. シーンを選択</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                外食・自炊・コンビニから選択。
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-semibold">2. 食事タイミング</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                朝ご飯・昼食・夜ご飯を指定。
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-semibold">3. 候補を確認</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                カロリーとPFC付きで3候補を表示。
              </p>
            </div>
          </div>
        </section>

        {!isPaid ? (
          <section className="border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">無料と有料の違い</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">AI解析回数</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>1日{FREE_DAILY_ANALYSIS_LIMIT}回</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">
                  1日{PAID_DAILY_ANALYSIS_LIMIT}回
                </p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">食事メニュー提案</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>なし</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">
                  1日{MEAL_SUGGESTION_DAILY_LIMIT}回
                </p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">写真の永続保存</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>なし</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">なし</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">確認・修正して保存</p>
                <p className="mt-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  無料でも利用可
                </p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-primary">
                  <CheckCircle2 className="size-4" />
                  有料でも同じ流れ
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
