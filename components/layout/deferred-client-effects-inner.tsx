"use client";

import { CleanupStaleSession } from "@/components/auth/cleanup-stale-session";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { PwaOfflineNotice } from "@/components/pwa/offline-notice";

/** 初回描画後にまとめて読み込む PWA / セッション系クライアント処理 */
export default function DeferredClientEffectsInner() {
  return (
    <>
      <CleanupStaleSession />
      <PwaOfflineNotice />
      <PwaInstallPrompt />
    </>
  );
}
