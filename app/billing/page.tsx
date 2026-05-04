import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  CreditCard,
  Keyboard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { ManageSubscriptionButton } from "@/components/meals/manage-subscription-button";
import { UpgradePlanButton } from "@/components/meals/upgrade-plan-button";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";
import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";
import { MEAL_SUGGESTION_DAILY_LIMIT } from "@/lib/meal-suggestions";

export const dynamic = "force-dynamic";
const PAID_PLAN_PRICE_LABEL = "550円";
const PAID_PLAN_TRIAL_LABEL = "14日間無料";

const paidBenefits = [
  {
    icon: Camera,
    title: `AI写真解析（1日${PAID_DAILY_ANALYSIS_LIMIT}回）`,
    body: "食事写真からカロリーとPFCを推定。無料プランは1日1回まで。",
  },
  {
    icon: Keyboard,
    title: "手入力で食事を登録",
    body: "写真がないときも、フォームから栄養値を直接入力して保存できます（無料プランは写真解析のみ）。",
  },
  {
    icon: Sparkles,
    title: `食事メニュー提案（1日${MEAL_SUGGESTION_DAILY_LIMIT}回）`,
    body: "外食・自炊・コンビニと、朝・昼・夜を選ぶと、過去の記録から候補メニューを提案します（有料のみ）。",
  },
  {
    icon: MessageCircle,
    title: "今日のAIアドバイス",
    body: "画面右下のカロちゃんから、当日の記録をもとにした一言アドバイスを表示できます（有料のみ）。",
  },
  {
    icon: CalendarDays,
    title: "過去日の履歴とカレンダー",
    body: "ダッシュボードで任意の過去日を選び、その日の食事一覧を表示。月の前後へも移動できます（無料は当日のみ）。",
  },
  {
    icon: BarChart3,
    title: "直近14日のカロリー・PFC推移",
    body: "日ごとの摂取カロリーとたんぱく質・脂質・炭水化物の推移をグラフで確認できます（無料は当日集計のみ）。",
  },
  {
    icon: Target,
    title: "目安カロリーで1件ショートカット登録",
    body: "食事がまだない日に、1日の目安と同じkcalの食事を1件だけまとめて登録できます（有料のみ）。",
  },
  {
    icon: ShieldCheck,
    title: "写真はサーバーに保存しない",
    body: "解析のために一時的に画像を扱い、確定後は数値・メモ・料理名などのテキスト情報だけを保存します（無料・有料共通）。",
  },
] as const;

export default async function BillingPage() {
  const { supabase, user } = await getAuthenticatedUserCached();

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
                  ? "支払い方法、請求履歴、解約はStripeの管理画面から確認できます。下記は有料プランで利用できる機能の一覧です。"
                  : `${PAID_PLAN_TRIAL_LABEL}で試せます。トライアル後は月額${PAID_PLAN_PRICE_LABEL}で、手入力・過去日の履歴・14日グラフ・食事提案・今日のAIアドバイス・目安カロリーのショートカット登録に加え、AI写真解析を1日${PAID_DAILY_ANALYSIS_LIMIT}回まで利用できます。`}
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
                14日間無料
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              最初の14日間は無料で試せます。トライアル終了後は月額{PAID_PLAN_PRICE_LABEL}です。AI写真解析は1日
              {PAID_DAILY_ANALYSIS_LIMIT}回、食事提案は1日{MEAL_SUGGESTION_DAILY_LIMIT}
              回に加え、手入力・過去日のダッシュボード・14日推移グラフ・今日のAIアドバイス・目安にそった1件登録が利用できます。
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
                14日間のトライアル期間中も、いつでも「サブスクの管理・解約」から解約できます。
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">有料プランでできること（全機能）</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            次の機能はすべて有料プラン契約中に利用できます。回数に上限があるものは、無料プランとの違いも本文に記載しています。
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {paidBenefits.map(({ icon: Icon, title, body }) => (
              <article key={title} className="border border-border bg-card p-4">
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
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
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">AI写真解析（1日あたり）</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>1日{FREE_DAILY_ANALYSIS_LIMIT}回</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">1日{PAID_DAILY_ANALYSIS_LIMIT}回</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">手入力で食事を登録</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>不可（写真解析のみ）</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">利用可</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">食事メニュー提案</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>不可</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">
                  1日{MEAL_SUGGESTION_DAILY_LIMIT}回
                </p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">今日のAIアドバイス（カロちゃん）</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>不可</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">利用可</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">過去日の履歴・カレンダー・14日グラフ</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>当日のみ（過去日選択・月移動・推移グラフは不可）</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">過去日・月移動・直近14日グラフを利用可</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">目安カロリーで1件ショートカット登録</p>
                <p className="mt-3 text-xs text-muted-foreground">無料</p>
                <p>不可</p>
                <p className="mt-2 text-xs text-muted-foreground">有料</p>
                <p className="font-semibold text-primary">利用可</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">写真の永続保存</p>
                <p className="mt-3 text-xs text-muted-foreground">無料・有料共通</p>
                <p className="font-semibold">いいえ（解析用に一時利用のみ）</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-muted-foreground">保存前の確認・修正</p>
                <p className="mt-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  無料・有料どちらでも利用可
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
