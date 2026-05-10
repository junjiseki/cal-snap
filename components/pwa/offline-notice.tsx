"use client";

import { useEffect, useState } from "react";

/**
 * オフライン時にページ上部へ簡易表示（トーストライブラリ未使用）。
 */
export function PwaOfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => {
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-border bg-muted px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm text-foreground"
    >
      インターネットに接続されていません。保存や解析など一部の機能が使えないことがあります。
    </div>
  );
}
