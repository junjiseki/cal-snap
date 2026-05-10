import type { Metadata } from "next";
import Link from "next/link";
import { PAID_DAILY_ANALYSIS_LIMIT } from "@/lib/meal-analysis";
import { MEAL_SUGGESTION_DAILY_LIMIT } from "@/lib/meal-suggestions";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | カロスナ",
  description:
    "カロスナの有料プランに関する販売価格、支払方法、解約、返品・返金、問い合わせ先などの表記です。",
  alternates: {
    canonical: "/commerce-disclosure",
  },
};

type DisclosureRow =
  | {
      label: string;
      value: string;
      href?: never;
    }
  | {
      label: string;
      value: string;
      href: string;
    };

function envOrSetupMessage(name: string) {
  return process.env[name]?.trim() || `本番環境変数 ${name} を設定してください。`;
}

function createDisclosureRows(): DisclosureRow[] {
  const siteUrl = getSiteUrl();

  return [
    {
      label: "販売事業者",
      value: envOrSetupMessage("LEGAL_SELLER_NAME"),
    },
    {
      label: "運営責任者",
      value: envOrSetupMessage("LEGAL_REPRESENTATIVE_NAME"),
    },
    {
      label: "所在地",
      value: envOrSetupMessage("LEGAL_BUSINESS_ADDRESS"),
    },
    {
      label: "電話番号",
      value: envOrSetupMessage("LEGAL_BUSINESS_PHONE"),
    },
    {
      label: "メールアドレス",
      value: envOrSetupMessage("LEGAL_CONTACT_EMAIL"),
    },
    {
      label: "お問い合わせ先",
      value: "お問い合わせフォーム",
      href: "/contact",
    },
    {
      label: "販売URL",
      value: siteUrl,
      href: siteUrl,
    },
    {
      label: "販売価格",
      value: "有料プラン: 14日間無料トライアル後、月額550円（税込）",
    },
    {
      label: "商品代金以外の必要料金",
      value: "インターネット接続料金、通信料金、端末利用料金などはユーザーの負担となります。",
    },
    {
      label: "支払方法",
      value: "クレジットカード決済（Stripe）",
    },
    {
      label: "支払時期",
      value:
        "14日間の無料トライアル終了後に初回請求が発生し、その後は毎月の更新日に月額料金が請求されます。トライアル期間中に解約した場合、月額料金は請求されません。",
    },
    {
      label: "役務の提供時期",
      value: "決済完了後、アカウントに有料プランが反映され次第、直ちに利用できます。",
    },
    {
      label: "有料プランの内容",
      value:
        `食事写真のAI解析を1日${PAID_DAILY_ANALYSIS_LIMIT}回、食事メニュー提案を1日${MEAL_SUGGESTION_DAILY_LIMIT}回まで利用できます。手入力での食事記録、過去日の履歴・カレンダー、直近14日のカロリー・PFCグラフ、今日のアドバイス、目安カロリーにそった1件ショートカット登録を利用できます。`,
    },
    {
      label: "申込期間・販売数量",
      value: "申込期間の定めはありません。デジタルサービスのため販売数量の制限はありません。",
    },
    {
      label: "解約方法",
      value:
        "アプリ内のプラン管理画面、またはStripeのサブスクリプション管理画面からいつでも解約できます。解約後も、すでに支払い済みの期間が終了するまでは有料機能を利用できる場合があります。",
    },
    {
      label: "返品・キャンセル・返金",
      value:
        "デジタルサービスの性質上、購入後の返品・キャンセルはできません。法令上必要な場合を除き、支払い済み料金の日割り返金または途中返金は行いません。",
    },
    {
      label: "動作環境",
      value:
        "最新版のGoogle Chrome、Safari、Microsoft Edgeなどのモダンブラウザ。スマートフォン、タブレット、PCで利用できます。",
    },
    {
      label: "表現および商品に関する注意書き",
      value:
        "本サービスのAI解析や食事提案は、食事管理の参考情報を提供するものであり、結果には個人差があります。医療行為、診断、治療、栄養指導を目的としたものではありません。",
    },
  ];
}

export default function CommerceDisclosurePage() {
  const disclosureRows = createDisclosureRows();

  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-primary">Legal Notice</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            特定商取引法に基づく表記
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            カロスナの有料プランに関する販売条件を記載しています。
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
                {row.href ? (
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
