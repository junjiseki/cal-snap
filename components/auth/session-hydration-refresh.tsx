"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** ログイン直後に表示が変わる認証ページ（初回 SSR だけ Cookie が遅れることがある） */
const PATHS = new Set(["/login", "/signup"]);

/**
 * OAuth 直後など、ブラウザにはセッション Cookie が付いたが初回 RSC だけ未ログインだった場合に
 * `router.refresh()` でサーバー結果を揃える。リロードしなくても `/` → `/meals/new` 等に追従する。
 */
export function SessionHydrationRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (!PATHS.has(pathname)) {
      refreshedRef.current = false;
      return;
    }

    refreshedRef.current = false;
    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || refreshedRef.current) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        refreshedRef.current = true;
        router.refresh();
      }
    });

    const t = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session || refreshedRef.current) return;
        refreshedRef.current = true;
        router.refresh();
      });
    }, 0);

    return () => {
      window.clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
