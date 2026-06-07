import { LazyDailyAdviceBanner } from "@/components/advice/lazy-daily-advice-banner";
import { getAuthenticatedUserWithProfileCached } from "@/lib/supabase/server";

type AdviceAccount = {
  userId: string;
  plan: "free" | "paid";
};

export async function DailyAdvice() {
  const { user, profile } = await getAuthenticatedUserWithProfileCached();
  const account: AdviceAccount | null =
    user && profile?.plan === "paid"
      ? {
          userId: user.id,
          plan: "paid",
        }
      : null;

  if (!account) {
    return null;
  }

  return <LazyDailyAdviceBanner userId={account.userId} plan="paid" />;
}
