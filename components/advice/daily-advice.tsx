import { DailyAdviceBanner } from "@/components/advice/daily-advice-banner";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export async function DailyAdvice() {
  let user: Awaited<ReturnType<typeof getAuthenticatedUserCached>>["user"] = null;
  let profile: Awaited<ReturnType<typeof getAuthenticatedUserCached>>["profile"] = null;
  try {
    const auth = await getAuthenticatedUserCached();
    user = auth.user;
    profile = auth.profile;
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Supabase public environment variables are not configured.") {
      throw error;
    }
  }

  if (!user) {
    return null;
  }

  const plan = profile?.plan === "paid" ? "paid" : "free";
  return <DailyAdviceBanner userId={user.id} plan={plan} />;
}
