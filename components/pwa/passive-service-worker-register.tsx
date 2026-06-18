"use client";

import { useEffect } from "react";
import { PASSIVE_SW_PATH, PASSIVE_SW_URL } from "@/lib/pwa-sw";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

async function registerPassiveServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  const existing = await navigator.serviceWorker.getRegistration("/");
  const scriptUrl =
    existing?.active?.scriptURL ??
    existing?.waiting?.scriptURL ??
    existing?.installing?.scriptURL;
  if (scriptUrl) {
    const pathname = new URL(scriptUrl).pathname;
    if (
      pathname !== PASSIVE_SW_PATH &&
      !pathname.startsWith(`${PASSIVE_SW_PATH}?`)
    ) {
      await existing?.unregister();
    }
  }

  const registration = await navigator.serviceWorker.register(PASSIVE_SW_URL, {
    scope: "/",
  });

  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });
}

/**
 * `/sw-passive.js` のみ登録。レガシー `/sw.js` は `ServiceWorkerLegacyCleanup` が対象。
 * Chrome/Edge の beforeinstallprompt は manifest + SW（fetch あり）が前提になりやすい。
 *
 * 初回は `load` 直後に update を試し、登録本体は `requestIdleCallback` で遅延する。
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

    void navigator.serviceWorker.getRegistration("/").then((registration) => {
      void registration?.update();
    });

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
