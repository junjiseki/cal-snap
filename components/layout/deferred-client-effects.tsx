"use client";

import dynamic from "next/dynamic";

const DeferredClientEffectsInner = dynamic(
  () => import("@/components/layout/deferred-client-effects-inner"),
  { ssr: false },
);

export function DeferredClientEffects() {
  return <DeferredClientEffectsInner />;
}
