import { DailyAdviceBanner } from "@/components/advice/daily-advice-banner";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export async function DailyAdvice() {
  const { user, profile } = await getAuthenticatedUserCached();

  if (!user) {
    return null;
  }

  const plan = profile?.plan === "paid" ? "paid" : "free";
  return <DailyAdviceBanner userId={user.id} plan={plan} />;
}
