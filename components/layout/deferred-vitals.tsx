"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
);

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

/**
 * 初回ユーザー操作後にマウントする。操作がない場合は load 後の
 * requestIdleCallback（またはタイムアウト）でフォールバック読み込みし、
 * 計測の取りこぼしを防ぐ。
 */
function scheduleVitalsMount(callback: () => void) {
  let settled = false;

  const settle = () => {
    if (settled) return;
    settled = true;
    for (const event of INTERACTION_EVENTS) {
      window.removeEventListener(event, settle, true);
    }
    callback();
  };

  const listenerOptions = { capture: true, passive: true } as const;
  for (const event of INTERACTION_EVENTS) {
    window.addEventListener(event, settle, listenerOptions);
  }

  const scheduleFallback = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(settle, {
        timeout: DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
      });
      return;
    }
    globalThis.setTimeout(settle, DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS);
  };

  if (document.readyState === "complete") {
    scheduleFallback();
    return;
  }
  window.addEventListener("load", scheduleFallback, { once: true });
}

export function DeferredVitals() {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    scheduleVitalsMount(() => setShouldMount(true));
  }, []);

  if (!shouldMount) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
