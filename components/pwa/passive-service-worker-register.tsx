"use client";

import { useEffect } from "react";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

const PASSIVE_SW_PATH = "/sw-passive.js";

async function registerPassiveServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  const existing = await navigator.serviceWorker.getRegistration("/");
  const scriptUrl =
    existing?.active?.scriptURL ??
    existing?.waiting?.scriptURL ??
    existing?.installing?.scriptURL;
  if (scriptUrl && new URL(scriptUrl).pathname !== PASSIVE_SW_PATH) {
    await existing?.unregister();
  }
  await navigator.serviceWorker.register(PASSIVE_SW_PATH, { scope: "/" });
}

/**
 * `/sw-passive.js` のみ登録。レガシー `/sw.js` は `ServiceWorkerLegacyCleanup` が対象。
 * Chrome/Edge の beforeinstallprompt は manifest + SW（fetch あり）が前提になりやすい。
 *
 * 登録は `load` 後に `requestIdleCallback` で遅延し、初回ペイント・ハイドレーションを優先する。
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

    const scheduleRegister = () => {
      const run = () => {
        void registerPassiveServiceWorker().catch(() => {
          /* 登録失敗は無視（オフライン・ポリシー等） */
        });
      };
      const ric = globalThis.requestIdleCallback;
      if (typeof ric === "function") {
        ric.call(globalThis, run, {
          timeout: DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
        });
      } else {
        globalThis.setTimeout(run, DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS);
      }
    };

    if (document.readyState === "complete") {
      scheduleRegister();
    } else {
      window.addEventListener("load", scheduleRegister, { once: true });
    }
  }, []);

  return null;
}
