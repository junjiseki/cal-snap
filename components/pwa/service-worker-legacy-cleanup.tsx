"use client";

import { useEffect } from "react";

/** 無効化後はコンポーネントごと削除してよい */
const LEGACY_CLEANUP_KEY = "cal-snap:sw-legacy-cleanup-v1";

export function ServiceWorkerLegacyCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
      return;
    }

    try {
      if (window.localStorage.getItem(LEGACY_CLEANUP_KEY) === "1") {
        return;
      }
    } catch {
      return;
    }

    let cancelled = false;

    void (async () => {
      let didUnregister = false;
      let didClearCaches = false;

      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            didUnregister = true;
            await Promise.all(regs.map((r) => r.unregister()));
          }
        }

        if ("caches" in window) {
          const keys = await caches.keys();
          if (keys.length > 0) {
            didClearCaches = true;
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        }
      } catch {
        /* 握りつぶす — respondWith 失敗と同様、SW不整合時に例外になり得る */
      }

      try {
        window.localStorage.setItem(LEGACY_CLEANUP_KEY, "1");
      } catch {
        /* ignore */
      }

      if (!cancelled && (didUnregister || didClearCaches)) {
        window.location.reload();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
