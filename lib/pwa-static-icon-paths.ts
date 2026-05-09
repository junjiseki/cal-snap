/**
 * iOS / PWA 向けアイコンなど、Service Worker にキャッシュさせず
 * HTTP では短い Cache-Control にしたいパス。
 *
 * `public/sw-passive.js` の `PWA_SHORT_CACHE_PATHS` と一致させること。
 */
export const PWA_SHORT_CACHE_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-v3.png",
  "/apple-touch-icon-180.png",
  "/apple-touch-icon-167x167.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-120x120.png",
  "/icon-192.png",
  "/icon-512.png",
] as const;

/** `<link rel="apple-touch-icon">`（180×180 の複数ファイルは並べない） */
export const APPLE_TOUCH_ICON_METADATA = [
  { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
  { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
  { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
] as const;
