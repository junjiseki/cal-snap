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

function scheduleAfterLoad(callback: () => void) {
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

export function LazyDailyAdviceBanner({
  userId,
  plan,
}: {
  userId: string;
  plan: "paid";
}) {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    scheduleAfterLoad(() => setShouldMount(true));
  }, []);

  if (!shouldMount) {
    return null;
  }

  return <DailyAdviceBanner userId={userId} plan={plan} />;
}
