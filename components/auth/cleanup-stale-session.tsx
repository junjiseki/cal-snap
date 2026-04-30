"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isStaleRefreshTokenError } from "@/lib/supabase/stale-session";

/** 無効なリフレッシュトークンが Cookie に残っているとき、サイレントに壊れたセッションを掃除する */
export function CleanupStaleSession() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getUser();
        if (cancelled || !error || !isStaleRefreshTokenError(error)) return;
        await supabase.auth.signOut();
      } catch {
        // createClient が env 未設定で throw する場合は何もしない
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
