import { DailyAdviceBanner } from "@/components/advice/daily-advice-banner";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export async function DailyAdvice() {
  const { supabase, user } = await getAuthenticatedUserCached();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.plan === "paid" ? "paid" : "free";
  return <DailyAdviceBanner userId={user.id} plan={plan} />;
}
