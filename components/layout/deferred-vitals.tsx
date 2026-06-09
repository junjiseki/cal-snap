"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

const DeferredVitalsInner = dynamic(
  () =>
    import("@/components/layout/deferred-vitals-inner").then((mod) => ({
      default: mod.DeferredVitalsInner,
    })),
  { ssr: false },
);

/**
 * 初回ユーザー操作後にマウントする。操作がない場合は load 後の
 * requestIdleCallback（またはタイムアウト）でフォールバック読み込みし、
 * 計測の取りこぼしを防ぐ。チャンク取得は shouldMount 後の next/dynamic で行う。
 */
function scheduleVitalsMount(callback: () => void): () => void {
  let settled = false;
  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
      idleId = window.requestIdleCallback(settle, {
        timeout: DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
      });
      return;
    }
    timeoutId = globalThis.setTimeout(
      settle,
      DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
    );
  };

  if (document.readyState === "complete") {
    scheduleFallback();
  } else {
    window.addEventListener("load", scheduleFallback, { once: true });
  }

  return () => {
    settled = true;
    for (const event of INTERACTION_EVENTS) {
      window.removeEventListener(event, settle, true);
    }
    window.removeEventListener("load", scheduleFallback);
    if (idleId !== undefined && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  };
}

export function DeferredVitals() {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancelSchedule = scheduleVitalsMount(() => {
      if (!cancelled) {
        setShouldMount(true);
      }
    });

    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, []);

  if (!shouldMount) {
    return null;
  }

  return <DeferredVitalsInner />;
}
