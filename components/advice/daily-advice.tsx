"use client";

import { useEffect, useState } from "react";
import { DailyAdviceBanner } from "@/components/advice/daily-advice-banner";
import { createClient } from "@/lib/supabase/client";

type AdviceAccount = {
  userId: string;
  plan: "free" | "paid";
};

export function DailyAdvice() {
  const [account, setAccount] = useState<AdviceAccount | null>(null);

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

        if (!cancelled) {
          setAccount({
            userId: user.id,
            plan: profile?.plan === "paid" ? "paid" : "free",
          });
        }
      } catch {
        if (!cancelled) setAccount(null);
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  return <DailyAdviceBanner userId={account?.userId ?? null} plan={account?.plan ?? null} />;
}
