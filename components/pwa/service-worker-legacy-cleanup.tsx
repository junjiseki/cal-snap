"use client";

import { useEffect } from "react";

/** 無効化後はコンポーネントごと削除してよい */
const LEGACY_CLEANUP_KEY = "cal-snap:sw-legacy-cleanup-v2";

/** 旧 `public/sw.js` が使っていた Cache Storage 名（ほか用途と共有しない） */
const LEGACY_CACHE_EXACT = new Set(["cal-snap-static-v1"]);

/** 旧実装の `/sw.js` のみ。`/sw-passive.js` は対象外 */
function isLegacyCalSnapSwScript(scriptUrl: string): boolean {
  if (!scriptUrl) return false;
  try {
    return new URL(scriptUrl).pathname === "/sw.js";
  } catch {
    return false;
  }
}

function isLegacyCalSnapCacheName(name: string): boolean {
  if (LEGACY_CACHE_EXACT.has(name)) return true;
  return name.startsWith("cal-snap-");
}

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
      try {
        let didUnregister = false;
        let didClearCaches = false;

        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            const scriptUrl =
              reg.installing?.scriptURL ??
              reg.waiting?.scriptURL ??
              reg.active?.scriptURL ??
              "";
            if (!isLegacyCalSnapSwScript(scriptUrl)) {
              continue;
            }
            const removed = await reg.unregister();
            if (removed) {
              didUnregister = true;
            }
          }
        }

        if ("caches" in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            if (!isLegacyCalSnapCacheName(key)) {
              continue;
            }
            const deleted = await caches.delete(key);
            if (deleted) {
              didClearCaches = true;
            }
          }
        }

        try {
          window.localStorage.setItem(LEGACY_CLEANUP_KEY, "1");
        } catch {
          return;
        }

        if (!cancelled && (didUnregister || didClearCaches)) {
          window.location.reload();
        }
      } catch {
        /* 登録解除／キャッシュ削除が失敗した場合はフラグを書かず、次回ロードで再試行 */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
