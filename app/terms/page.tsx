import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | カロリースナップ",
  description:
    "カロリースナップの利用条件、有料プラン、AI推定、禁止事項、免責、解約に関する規約です。",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "1. 本規約の適用",
    body: [
      "本利用規約は、カロリースナップ（以下「本サービス」）の利用条件を定めるものです。",
      "ユーザーは、本サービスを利用することで本規約に同意したものとみなされます。",
    ],
  },
  {
    title: "2. アカウント",
    body: [
      "ユーザーは、正確な情報を用いてアカウントを作成し、自己の責任でログイン情報を管理するものとします。",
      "アカウントの不正利用、第三者への譲渡、貸与、共有は禁止します。",
    ],
  },
  {
    title: "3. サービス内容",
    body: [
      "本サービスは、食事写真またはユーザーが入力した食事データをもとに、摂取カロリー、PFC、食事履歴を記録・管理する機能を提供します。",
      "有料プランでは、食事写真のAI解析回数の拡張および過去の食事データをもとにした食事メニュー提案機能を利用できます。",
    ],
  },
  {
    title: "4. AI解析・食事提案について",
    body: [
      "AIによるカロリー、PFC、食事メニュー提案は推定値および参考情報であり、正確性、完全性、有用性を保証するものではありません。",
      "本サービスは医療行為、診断、治療、栄養指導を目的とするものではありません。疾病管理、食事制限、アレルギー対応、妊娠中・授乳中の食事管理などについては、医師または管理栄養士など専門家へ相談してください。",
      "ユーザーは、AI推定値または提案内容を確認し、自身の判断と責任で利用するものとします。",
    ],
  },
  {
    title: "5. 有料プラン",
    body: [
      "有料プランの料金は月額550円（税込）です。",
      "有料プランでは、食事写真のAI解析を1日3回まで、食事メニュー提案を1日3回まで利用できます。回数は日本時間の1日単位で判定します。",
      "無料プランでは、食事写真のAI解析を1日1回まで利用できます。食事メニュー提案は有料プラン限定機能です。",
      "料金、提供内容、利用回数は、サービス改善または運営上の都合により変更される場合があります。重要な変更がある場合は、サービス上で通知します。",
    ],
  },
  {
    title: "6. 決済・解約",
    body: [
      "有料プランの決済処理はStripeを通じて行います。本サービスはクレジットカード番号などの決済手段情報を保存しません。",
      "ユーザーは、アプリ内のプラン管理画面またはStripeの管理画面からサブスクリプションを解約できます。",
      "解約後も、すでに支払い済みの期間が終了するまでは有料機能を利用できる場合があります。",
      "法令上必要な場合を除き、支払い済み料金の日割り返金または途中返金は行いません。",
    ],
  },
  {
    title: "7. 禁止事項",
    body: [
      "ユーザーは、本サービスの利用にあたり、法令または公序良俗に反する行為、不正アクセス、解析回数制限の回避、他者の権利侵害、サービス運営を妨害する行為を行ってはなりません。",
      "スパム、虚偽情報の送信、過度なリクエスト、AI機能の不正利用、リバースエンジニアリングも禁止します。",
    ],
  },
  {
    title: "8. データの取り扱い",
    body: [
      "本サービスにおける個人情報、食事データ、食事写真、外部サービス利用に関する取り扱いは、プライバシーポリシーに定めます。",
      "ユーザーがアップロードした食事写真はAI解析のために一時的に利用されますが、本サービスのStorageまたはデータベースには永続保存しません。",
    ],
  },
  {
    title: "9. サービスの変更・停止",
    body: [
      "本サービスは、メンテナンス、障害、外部サービスの仕様変更、運営上の必要により、全部または一部を変更、停止、中断することがあります。",
      "本サービスは、可能な範囲で安定した提供に努めますが、常時利用可能であることを保証しません。",
    ],
  },
  {
    title: "10. 免責",
    body: [
      "本サービスの利用により生じた体調変化、食事判断、健康状態、第三者サービスの利用、通信障害、データ消失その他の損害について、運営者に故意または重過失がある場合を除き、責任を負いません。",
      "本サービスが外部サービスを利用する場合、当該外部サービスの障害、仕様変更、提供停止により本サービスの一部機能が利用できなくなる場合があります。",
    ],
  },
  {
    title: "11. 規約の変更",
    body: [
      "本規約は、法令変更、サービス内容の変更、運営上の必要に応じて改定することがあります。",
      "重要な変更がある場合は、サービス上での表示など適切な方法で周知します。",
    ],
  },
  {
    title: "12. 準拠法・管轄",
    body: [
      "本規約は日本法に準拠します。",
      "本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-primary">Terms</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            利用規約
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            本規約は、カロリースナップの利用条件、有料プラン、AI解析・食事提案、禁止事項、免責などを定めるものです。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/commerce-disclosure"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              特定商取引法に基づく表記
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">制定日: 2026年5月3日</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="border border-border bg-card p-5 sm:p-6">
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
