import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { AccountDangerActions } from "@/components/account/account-danger-actions";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            設定を変更するにはログインが必要です。
          </p>
          <Link
            href="/login?next=/settings"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

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
              <Settings className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">アカウント</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">設定</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <section className="border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">セッション</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            ログアウトとアカウント削除はこちらで操作します。
          </p>
          <div className="mt-4">
            <AccountDangerActions />
          </div>
        </section>
      </div>
    </main>
  );
}
