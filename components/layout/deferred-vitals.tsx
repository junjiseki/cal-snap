"use client";

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
);

/** 計測スクリプトは初回インタラクション後に読み込み、RES に影響しにくくする */
export function DeferredVitals() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
