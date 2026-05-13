"use client";

import { useEffect } from "react";

const PASSIVE_SW_PATH = "/sw-passive.js";

/**
 * `/sw-passive.js` のみ登録。レガシー `/sw.js` は `ServiceWorkerLegacyCleanup` が対象。
 * Chrome/Edge の beforeinstallprompt は manifest + SW（fetch あり）が前提になりやすい。
 */
export function PassiveServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }

    function register() {
      void (async () => {
        const existing = await navigator.serviceWorker.getRegistration("/");
        const scriptUrl =
          existing?.active?.scriptURL ??
          existing?.waiting?.scriptURL ??
          existing?.installing?.scriptURL;
        if (scriptUrl && new URL(scriptUrl).pathname !== PASSIVE_SW_PATH) {
          await existing?.unregister();
        }
        await navigator.serviceWorker.register(PASSIVE_SW_PATH, { scope: "/" });
      })().catch(() => {
        /* 登録失敗は無視（オフライン・ポリシー等） */
      });
    }

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
