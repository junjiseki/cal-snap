"use client";

import dynamic from "next/dynamic";

const DeferredClientEffectsInner = dynamic(
  () =>
    import("@/components/layout/deferred-client-effects-inner").catch(
      (error) => {
        console.error("[DeferredClientEffects] chunk load failed", error);
        return { default: () => null };
      },
    ),
  { ssr: false },
);

export function DeferredClientEffects() {
  return <DeferredClientEffectsInner />;
}
