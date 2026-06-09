"use client";

import { lazy, Suspense } from "react";

const LazyDeferredClientEffectsInner = lazy(
  () => import("@/components/layout/deferred-client-effects-inner"),
);

export function DeferredClientEffects() {
  return (
    <Suspense fallback={null}>
      <LazyDeferredClientEffectsInner />
    </Suspense>
  );
}
