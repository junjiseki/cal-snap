import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";
import { AppHeaderClient, type AppHeaderAccount } from "@/components/layout/app-header-client";

export async function AppHeader({ className }: { className?: string }) {
  const { supabase, user } = await getAuthenticatedUser();

  let account: AppHeaderAccount | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan,daily_calorie_goal")
      .eq("id", user.id)
      .maybeSingle();
    account = {
      email: user.email ?? "（メール未設定）",
      plan: profile?.plan ?? "free",
      initialGoal: profile?.daily_calorie_goal ?? 2000,
      freeDailyAnalysisLimit: FREE_DAILY_ANALYSIS_LIMIT,
      paidDailyAnalysisLimit: PAID_DAILY_ANALYSIS_LIMIT,
    };
  }

  return <AppHeaderClient account={account} className={className} />;
}
