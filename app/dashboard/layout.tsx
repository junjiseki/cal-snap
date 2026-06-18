import type { ReactNode } from "react";
import Script from "next/script";
import { PASSIVE_SW_MIGRATE_URL } from "@/lib/pwa-sw";

/** ダッシュボード専用: SW 解除スクリプトを子より先に評価させる */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script src={`${PASSIVE_SW_MIGRATE_URL}&dash=1`} strategy="beforeInteractive" />
      {children}
    </>
  );
}
