"use client";

import { CleanupStaleSession } from "@/components/auth/cleanup-stale-session";
import { PassiveServiceWorkerRegister } from "@/components/pwa/passive-service-worker-register";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { PwaOfflineNotice } from "@/components/pwa/offline-notice";
import { ServiceWorkerLegacyCleanup } from "@/components/pwa/service-worker-legacy-cleanup";

/** 初回描画後にまとめて読み込む PWA / セッション系クライアント処理 */
export default function DeferredClientEffectsInner() {
  return (
    <>
      <CleanupStaleSession />
      <ServiceWorkerLegacyCleanup />
      <PassiveServiceWorkerRegister />
      <PwaOfflineNotice />
      <PwaInstallPrompt />
    </>
  );
}
