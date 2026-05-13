"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isStaleRefreshTokenError } from "@/lib/supabase/stale-session";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

function afterInitialRender(callback: () => void) {
  const run = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, {
        timeout: DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
      });
      return;
    }
    globalThis.setTimeout(callback, DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS);
  };

  if (document.readyState === "complete") {
    run();
    return;
  }
  window.addEventListener("load", run, { once: true });
}

/** 無効なリフレッシュトークンが Cookie に残っているとき、サイレントに壊れたセッションを掃除する */
export function CleanupStaleSession() {
  useEffect(() => {
    let cancelled = false;
    afterInitialRender(() => {
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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
