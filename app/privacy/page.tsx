export const metadata = {
  title: "プライバシーポリシー | カロリースナップ",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold">プライバシーポリシー</h1>
      <p className="mt-4 text-sm text-muted-foreground leading-7">
        カロリースナップ（以下、「本サービス」）は、ユーザーの個人情報を適切に取り扱います。本ポリシーは、
        本サービスで取得する情報、その利用目的、管理方法について定めるものです。
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">1. 取得する情報</h2>
        <p className="text-sm text-muted-foreground leading-7">
          本サービスでは、アカウント登録時のメールアドレス、食事記録データ、利用状況に関するログ情報を取得する場合があります。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">2. 利用目的</h2>
        <p className="text-sm text-muted-foreground leading-7">
          取得した情報は、本人認証、サービス提供、機能改善、不正利用の防止、お問い合わせ対応のために利用します。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">3. 第三者提供</h2>
        <p className="text-sm text-muted-foreground leading-7">
          法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者へ提供しません。
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">4. 改定</h2>
        <p className="text-sm text-muted-foreground leading-7">
          本ポリシーは、必要に応じて内容を改定することがあります。重要な変更がある場合は、アプリ上で通知します。
        </p>
      </section>
    </main>
  );
}
