import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | カロリースナップ",
  description:
    "カロリースナップにおける個人情報、食事データ、食事写真、AI解析、外部サービス利用に関する取り扱い方針です。",
  alternates: {
    canonical: "/privacy",
  },
};

const policySections = [
  {
    title: "1. 取得する情報",
    body: [
      "本サービスは、アカウント作成、ログイン、食事記録、AI解析、課金状態の判定に必要な範囲で情報を取得します。",
      "取得する情報には、メールアドレス、認証プロバイダーから提供される識別子、食事日時、総摂取カロリー、PFC、料理名、推定量、メモ、AI解析ログ、プラン種別が含まれます。",
      "食事写真はAI解析のために一時的にAPIへ送信されますが、本サービスのStorageまたはデータベースには永続保存しません。",
    ],
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した情報は、本人認証、食事写真からの栄養推定、食事記録の保存、日別の摂取カロリー・PFC集計、ログイン状態の維持、不正利用防止、解析回数制限、課金状態の確認、サービス改善のために利用します。",
      "AI解析結果は推定値であり、ユーザーが確認・修正したうえで食事データとして保存されます。",
    ],
  },
  {
    title: "3. 食事写真とAI解析",
    body: [
      "ユーザーが選択した画像は、解析処理中に一時的にbase64化され、AI解析サービスへ送信されます。",
      "画像ファイルそのものは本サービスのStorageやデータベースには保存しません。",
      "データベースに保存されるのは、ユーザーが確認・修正した解析結果、食事明細、メモ、解析ログなどのテキストまたは数値データです。",
    ],
  },
  {
    title: "4. 外部サービスの利用",
    body: [
      "本サービスは、認証、データ保存、AI解析、課金機能のために外部サービスを利用します。",
      "主な外部サービスには、Supabase（認証・データベース）、Google Gemini API（食事写真のAI解析・食事メニュー提案）、Google OAuth（Googleログインを有効化している場合）、Stripe（有料プランの課金処理を有効化している場合）が含まれます。",
      "Stripeを利用した決済では、カード番号などの決済手段情報はStripeが処理し、本サービスのデータベースには保存しません。",
      "各外部サービスに送信される情報は、サービス提供に必要な範囲に限定します。Stripeの個人情報の取り扱いについては、Stripeのプライバシーポリシーもご確認ください。",
    ],
  },
  {
    title: "5. 第三者提供",
    body: [
      "法令に基づく場合、ユーザーの同意がある場合、またはサービス提供に必要な外部委託先へ必要最小限の情報を提供する場合を除き、個人情報を第三者へ提供しません。",
      "外部サービスの利用は、前項に記載した目的の範囲で行います。",
    ],
  },
  {
    title: "6. Cookie等の利用",
    body: [
      "本サービスは、ログイン状態の維持、セッション管理、不正利用防止、サービスの動作に必要な範囲でCookieまたは同等の技術を利用します。",
      "ブラウザ設定によりCookieを無効化した場合、一部機能が利用できないことがあります。",
    ],
  },
  {
    title: "7. 安全管理",
    body: [
      "本サービスは、アクセス制御、Row Level Security、認証情報の管理、不要な画像保存を行わない設計などにより、取得情報の漏えい、滅失、改ざん、不正アクセスの防止に努めます。",
      "ただし、インターネット上の通信や外部サービスの利用に伴うリスクを完全に排除することはできません。",
    ],
  },
  {
    title: "8. 開示・訂正・削除",
    body: [
      "ユーザーは、自身の食事記録をアプリ上で確認、編集、削除できます。",
      "アカウント情報や保存データに関する開示、訂正、削除、利用停止を希望する場合は、運営者の指定する問い合わせ先までご連絡ください。",
    ],
  },
  {
    title: "9. 未成年の利用",
    body: [
      "未成年のユーザーが本サービスを利用する場合は、親権者など法定代理人の同意を得たうえで利用してください。",
    ],
  },
  {
    title: "10. 免責",
    body: [
      "本サービスのAI解析結果は、画像から推定された参考値です。医療、診断、治療、栄養指導を目的とするものではありません。",
      "食事制限、疾病管理、アレルギー対応、治療方針に関する判断は、医師や管理栄養士などの専門家に相談してください。",
    ],
  },
  {
    title: "11. 改定",
    body: [
      "本ポリシーは、法令変更、サービス内容の変更、利用する外部サービスの変更に応じて改定することがあります。",
      "重要な変更がある場合は、サービス上での表示など適切な方法により周知します。",
    ],
  },
  {
    title: "12. お問い合わせ",
    body: [
      "本ポリシーまたは個人情報の取り扱いに関するお問い合わせは、お問い合わせフォームからご連絡ください。",
      "公開前に、実際に利用する事業者名、所在地などを必要に応じて追記してください。",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-primary">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            プライバシーポリシー
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            カロリースナップは、食事写真から摂取カロリーとPFCを推定し、ユーザーが確認・修正した食事データを保存するサービスです。本ポリシーでは、本サービスにおける個人情報および関連データの取り扱いを定めます。
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            お問い合わせフォームへ
          </Link>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/terms"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              利用規約
            </Link>
            <Link
              href="/commerce-disclosure"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              特定商取引法に基づく表記
            </Link>
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              Stripeプライバシーポリシー
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            制定日: 2026年5月1日
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="space-y-5">
          {policySections.map((section) => (
            <article
              key={section.title}
              className="border border-border bg-card p-5 sm:p-6"
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
