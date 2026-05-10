/**
 * HTTP セキュリティ関連の共有定数（`next.config.ts`・`proxy.ts`）。
 */
export const PERMISSIONS_POLICY =
  "camera=(self), microphone=(), geolocation=(), payment=()";

/** `public/` 配下のサービスワーカー応答用（`next.config` の `headers`） */
export const SERVICE_WORKER_SCRIPT_HEADERS: { key: string; value: string }[] = [
  {
    key: "Content-Type",
    value: "application/javascript; charset=utf-8",
  },
  {
    key: "Cache-Control",
    value: "no-cache, no-store, must-revalidate",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self'",
  },
];
