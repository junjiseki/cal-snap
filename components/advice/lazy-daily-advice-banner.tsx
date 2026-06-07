"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
  DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
} from "@/lib/ui-timing";

const DailyAdviceBanner = dynamic(
  () =>
    import("@/components/advice/daily-advice-banner").then(
      (mod) => mod.DailyAdviceBanner,
    ),
  { ssr: false },
);

function scheduleAfterLoad(callback: () => void): () => void {
  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const run = () => {
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(callback, {
        timeout: DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS,
      });
      return;
    }
    timeoutId = globalThis.setTimeout(
      callback,
      DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS,
    );
  };

  if (document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run, { once: true });
  }

  return () => {
    window.removeEventListener("load", run);
    if (idleId !== undefined && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
  };
}

export function LazyDailyAdviceBanner({
  userId,
  plan,
}: {
  userId: string;
  plan: "paid";
}) {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancelSchedule = scheduleAfterLoad(() => {
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

  return <DailyAdviceBanner userId={userId} plan={plan} />;
}
