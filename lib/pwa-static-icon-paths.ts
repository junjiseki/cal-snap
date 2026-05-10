/**
 * iOS / PWA 向けアイコンなど、Service Worker にキャッシュさせず
 * HTTP では短い Cache-Control にしたいパス。
 *
 * `public/sw-passive.js` の `PWA_SHORT_CACHE_PATHS` と一致させること。
 */
export const PWA_SHORT_CACHE_PATHS = [
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
] as const;

/** `<link rel="apple-touch-icon">`*/
export const APPLE_TOUCH_ICON_METADATA = [
  // iOS のホーム画面追加で古い失敗キャッシュを掴むことがあるため、URL を版管理する。
  { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
] as const;
  