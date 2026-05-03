import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | カロリースナップ",
  description:
    "カロリースナップの有料プランに関する販売価格、支払方法、解約、返品・返金、問い合わせ先などの表記です。",
  alternates: {
    canonical: "/commerce-disclosure",
  },
};

const disclosureRows = [
  {
    label: "販売事業者",
    value: "スタイル",
  },
  {
    label: "所在地",
    value: "請求があった場合に遅滞なく開示します。",
  },
  {
    label: "電話番号",
    value: "請求があった場合に遅滞なく開示します。",
  },
  {
    label: "お問い合わせ先",
    value: "お問い合わせフォームよりご連絡ください。",
    href: "/contact",
  },
  {
    label: "販売価格",
    value: "有料プラン: 月額550円（税込）",
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続料金、通信料金などはユーザーの負担となります。",
  },
  {
    label: "支払方法・支払時期",
    value: "Stripeを通じた決済。有料プラン申込時および更新日に請求されます。",
  },
  {
    label: "提供時期",
    value: "決済完了後、アカウントに有料プランが反映され次第利用できます。",
  },
  {
    label: "有料プランの内容",
    value:
      "食事写真のAI解析を1日3回、過去の食事データをもとにした食事メニュー提案を1日3回まで利用できます。",
  },
  {
    label: "解約方法",
    value:
      "プラン管理画面またはStripeの管理画面から解約できます。サービスの性質上、法令上必要な場合を除き、支払い済み料金の日割り返金または途中返金は行いません。",
  },
] as const;

export default function CommerceDisclosurePage() {
  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-primary">Legal Notice</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            特定商取引法に基づく表記
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            カロリースナップの有料プランに関する販売条件を記載しています。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              プライバシーポリシー
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">制定日: 2026年5月3日</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <dl className="border border-border bg-card">
          {disclosureRows.map((row) => (
            <div
              key={row.label}
              className="grid gap-2 border-b border-border p-4 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:p-5"
            >
              <dt className="text-sm font-semibold">{row.label}</dt>
              <dd className="text-sm leading-7 text-muted-foreground">
                {"href" in row ? (
                  <Link href={row.href} className="font-semibold text-primary hover:underline">
                    {row.value}
                  </Link>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
