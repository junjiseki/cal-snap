import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";
import {
  AppHeaderClient,
  type AppHeaderAccount,
} from "@/components/layout/app-header-client";
import { PublicAppHeaderClient } from "@/components/layout/public-app-header-client";
import { getAuthenticatedUserWithProfileCached } from "@/lib/supabase/server";

export async function AppHeader({ className }: { className?: string }) {
  const { user, profile } = await getAuthenticatedUserWithProfileCached();

  if (!user) {
    return <PublicAppHeaderClient className={className} />;
  }

  const account: AppHeaderAccount = {
    email: user.email ?? "（メール未設定）",
    displayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : "",
    plan: profile?.plan ?? "free",
    freeDailyAnalysisLimit: FREE_DAILY_ANALYSIS_LIMIT,
    paidDailyAnalysisLimit: PAID_DAILY_ANALYSIS_LIMIT,
  };

  return <AppHeaderClient account={account} className={className} />;
}
