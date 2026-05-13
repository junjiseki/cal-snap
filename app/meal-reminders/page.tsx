import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { MealReminderSettingsForm } from "@/components/meals/meal-reminder-settings-form";
import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";
import { getVapidPublicKey } from "@/lib/push-subscriptions";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MealRemindersPage() {
  const { supabase, user } = await getAuthenticatedUserCached();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
        <div className="border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">ログインが必要です</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            食事時間を登録するにはログインしてください。
          </p>
          <Link
            href="/login?next=/meal-reminders"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase
      .from("meal_reminder_settings")
      .select("id,notify_time,enabled")
      .eq("user_id", user.id)
      .order("notify_time", { ascending: true }),
  ]);

  const isPaid = profile?.plan === "paid";
  const vapidPublicKey = getVapidPublicKey();

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
              <BellRing className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">
                食事リマインド
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                食事時間の登録
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            記録を促したい食事時間を、必要な分だけ最大8回まで登録できます。
            通知の到着は、通信状況・端末の設定・バックグラウンド制限・サーバー側の送信タイミングなどの影響で、登録した時刻から前後にずれることがあります。
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-5 sm:px-8 sm:py-6">
        {!isPaid ? (
          <section className="border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">有料プラン限定機能です</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              食事時間の登録は、有料プランで利用できます。毎日の記録タイミングを決めて、食事記録を続けやすくします。
            </p>
            <Link
              href="/billing"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              プランを見る
            </Link>
          </section>
        ) : (
          <>
            <section className="border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">通知設定</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                この端末で食事時間のお知らせを受け取るには、通知を許可してください。
                許可後も、表示どおりの分単位で届くとは限らず、ズレが生じる場合があります。
              </p>
              <div className="mt-4">
                <PushNotificationSettings vapidPublicKey={vapidPublicKey} />
              </div>
            </section>

            <section className="border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">登録する食事時間</h2>
              <div className="mt-4">
                <MealReminderSettingsForm initialSettings={settings ?? []} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
