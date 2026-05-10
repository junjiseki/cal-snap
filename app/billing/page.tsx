import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BellRing,
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

const paidBenefitGroups = [
  {
    id: "record",
    heading: "食事の記録",
    lead: "写真・手入力・ショートカットから、日々の摂取を残せます。",
    items: [
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
        icon: Target,
        title: "目安カロリーで1件ショートカット登録",
        body: "食事がまだない日に、1日の目安と同じkcalの食事を1件だけまとめて登録できます（有料のみ）。",
      },
      {
        icon: ShieldCheck,
        title: "写真はサーバーに保存しない",
        body: "解析のために一時的に画像を扱い、確定後は数値・メモ・料理名などのテキスト情報だけを保存します（無料・有料共通）。",
      },
    ],
  },
  {
    id: "insight",
    heading: "振り返りと次の一手",
    lead: "履歴・グラフ・提案・アドバイスで、続けやすくします。",
    items: [
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
        icon: Sparkles,
        title: `食事メニュー提案（1日${MEAL_SUGGESTION_DAILY_LIMIT}回）`,
        body: "外食・自炊・コンビニと、朝・昼・夜を選ぶと、過去の記録から候補メニューを提案します（有料のみ）。",
      },
      {
        icon: MessageCircle,
        title: "今日のアドバイス",
        body: "画面右下のカロちゃんから、当日の記録をもとにした一言アドバイスを表示できます（有料のみ）。",
      },
      {
        icon: BellRing,
        title: "食事時間の通知",
        body: "登録した食事時間にスマホやPCへお知らせします。iPhoneではホーム画面に追加したアプリ版で利用できます（有料のみ）。",
      },
    ],
  },
] as const;

const planComparisonRows = [
  {
    label: "AI写真解析（1日あたり）",
    free: `1日${FREE_DAILY_ANALYSIS_LIMIT}回`,
    paid: `1日${PAID_DAILY_ANALYSIS_LIMIT}回`,
  },
  {
    label: "手入力で食事を登録",
    free: "不可（写真解析のみ）",
    paid: "利用可",
  },
  {
    label: "食事メニュー提案",
    free: "不可",
    paid: `1日${MEAL_SUGGESTION_DAILY_LIMIT}回`,
  },
  {
    label: "今日のアドバイス（カロちゃん）",
    free: "不可",
    paid: "利用可",
  },
  {
    label: "食事時間の通知",
    free: "不可",
    paid: "利用可（iPhoneはホーム画面に追加）",
  },
  {
    label: "過去日の履歴・カレンダー・14日グラフ",
    free: "当日のみ（過去日・月移動・推移グラフは不可）",
    paid: "過去日・月移動・直近14日グラフを利用可",
  },
  {
    label: "目安カロリーで1件ショートカット登録",
    free: "不可",
    paid: "利用可",
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
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            ダッシュボード
          </Link>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">プラン</p>
              <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
                {isPaid ? "有料プランを管理" : "食事管理を、日常に。"}
              </h1>
              {isPaid ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  支払い方法・請求履歴・解約は Stripe の管理画面から確認できます。下記は有料プランで利用できる機能です。
                </p>
              ) : (
                <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <p>
                    <span className="font-medium text-foreground">{PAID_PLAN_TRIAL_LABEL}</span>
                    でお試しのうえ、トライアル後は月額{" "}
                    <span className="font-medium text-foreground">{PAID_PLAN_PRICE_LABEL}</span>{" "}
                    で次の機能がまとめて使えます。
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
                    <li>AI 写真解析（1日{PAID_DAILY_ANALYSIS_LIMIT}回）</li>
                    <li>手入力での食事登録</li>
                    <li>過去日の履歴・カレンダー・直近14日のグラフ</li>
                    <li>
                      食事メニュー提案（1日{MEAL_SUGGESTION_DAILY_LIMIT}回）・今日の AI アドバイス・食事時間の通知
                    </li>
                    <li>目安カロリーにそった1件ショートカット登録</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-10 sm:px-8 sm:py-8 sm:pb-8">
        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-5">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              現在のプラン
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isPaid ? "有料" : "無料"}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {isPaid ? (
                <>有料プランをご利用中です。利用中の機能は、この下の「有料プランでできること」を参照してください。</>
              ) : (
                <>
                  無料プランは 1 日 {FREE_DAILY_ANALYSIS_LIMIT} 回まで AI 写真解析できます。有料プランとの違いは、この下の比較表で確認できます。
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border-2 border-primary bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">有料プラン</p>
                <div className="mt-2 flex items-end gap-1">
                  <p className="text-4xl font-semibold tracking-tight">{PAID_PLAN_PRICE_LABEL}</p>
                  <p className="pb-1 text-sm text-muted-foreground">/ 月</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                14日間無料
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>最初の 14 日間は無料。以降は月額 {PAID_PLAN_PRICE_LABEL} です。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>
                  AI 写真解析 1 日 {PAID_DAILY_ANALYSIS_LIMIT} 回、食事提案 1 日 {MEAL_SUGGESTION_DAILY_LIMIT}{" "}
                  回。
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>手入力・過去日ダッシュボード・14 日グラフ・AI アドバイス・食事時間の通知・目安ショートカット登録。</span>
              </li>
            </ul>
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

        <section className="space-y-6" aria-labelledby="billing-features-heading">
          <div>
            <h2 id="billing-features-heading" className="text-xl font-semibold tracking-tight">
              有料プランでできること
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              契約中は次の機能がすべて利用できます。回数制限がある項目は、各カード内で無料プランとの違いも記載しています。
            </p>
          </div>

          <div className="space-y-10">
            {paidBenefitGroups.map((group) => (
              <div key={group.id}>
                <div className="border-b border-border pb-3">
                  <h3 className="text-base font-semibold text-foreground">{group.heading}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{group.lead}</p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {group.items.map(({ icon: Icon, title, body }) => (
                    <article
                      key={title}
                      className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </span>
                      <h4 className="mt-4 text-balance text-sm font-semibold leading-snug">{title}</h4>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">食事メニュー提案</p>
              <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                過去の食事から、次に食べる候補を作成
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                外食・自炊・コンビニと、朝・昼・夜を選ぶだけで、AI が過去の傾向からメニューを提案します。有料プランでは 1 日{" "}
                {MEAL_SUGGESTION_DAILY_LIMIT} 回まで利用できます。
              </p>
            </div>
            <Link
              href="/suggestions"
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-muted sm:h-10 lg:w-auto lg:self-start"
            >
              食事提案を見る
              <Sparkles className="size-4 shrink-0" />
            </Link>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            <li className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground">Step 1</span>
              <p className="mt-1 text-sm font-semibold">シーンを選択</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">外食・自炊・コンビニ</p>
            </li>
            <li className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground">Step 2</span>
              <p className="mt-1 text-sm font-semibold">食事のタイミング</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">朝・昼・夜</p>
            </li>
            <li className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground">Step 3</span>
              <p className="mt-1 text-sm font-semibold">候補を確認</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">カロリーと PFC 付きで 3 件</p>
            </li>
          </ol>
        </section>

        {!isPaid ? (
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="billing-compare-heading">
            <h2 id="billing-compare-heading" className="text-xl font-semibold tracking-tight">
              無料と有料の比較
            </h2>

            <div className="mt-6 space-y-3 md:hidden">
              {planComparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold leading-snug text-foreground">{row.label}</p>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        無料
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{row.free}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 px-3 py-2.5 ring-1 ring-primary/20">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-primary">有料</p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                        {row.paid}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full min-w-xl border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                      項目
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">
                      無料
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold text-primary">
                      有料
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {planComparisonRows.map((row) => (
                    <tr key={row.label} className="bg-card">
                      <th
                        scope="row"
                        className="px-4 py-3.5 align-top font-medium text-foreground"
                      >
                        {row.label}
                      </th>
                      <td className="px-4 py-3.5 align-top text-muted-foreground">{row.free}</td>
                      <td className="px-4 py-3.5 align-top font-medium text-foreground">{row.paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  無料・有料共通
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">写真の永続保存はしません</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  解析用に一時的に画像を扱い、保存するのは数値・メモ・料理名などのテキストです。
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  無料・有料共通
                </p>
                <p className="mt-1 flex items-start gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  保存前の確認・修正
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  解析結果はそのまま確定せず、いつでも編集してから保存できます。
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
