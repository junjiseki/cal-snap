"use client";

import { useEffect, useState } from "react";
import {
  FREE_DAILY_ANALYSIS_LIMIT,
  PAID_DAILY_ANALYSIS_LIMIT,
} from "@/lib/meal-analysis";
import { AppHeaderClient, type AppHeaderAccount } from "@/components/layout/app-header-client";
import { PublicAppHeaderClient } from "@/components/layout/public-app-header-client";
import { createClient } from "@/lib/supabase/client";

export function AppHeader({ className }: { className?: string }) {
  const [account, setAccount] = useState<AppHeaderAccount | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setAccount(null);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;
        setAccount({
          email: user.email ?? "（メール未設定）",
          displayName:
            typeof user.user_metadata?.display_name === "string"
              ? user.user_metadata.display_name
              : "",
          plan: profile?.plan ?? "free",
          freeDailyAnalysisLimit: FREE_DAILY_ANALYSIS_LIMIT,
          paidDailyAnalysisLimit: PAID_DAILY_ANALYSIS_LIMIT,
        });
      } catch {
        if (!cancelled) setAccount(null);
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!account) {
    return <PublicAppHeaderClient className={className} />;
  }

  return <AppHeaderClient account={account} className={className} />;
}
