"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () =>
    import("@vercel/analytics/next").then((mod) => ({
      default: mod.Analytics,
    })),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({
      default: mod.SpeedInsights,
    })),
  { ssr: false },
);

export function DeferredVitalsInner() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
