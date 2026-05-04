/**
 * 旧クライアントが URL をポーリングしても 404 にならないようにするためのプレースホルダ。
 * フェッチは横取りしない（リスナーなし = ブラウザ既定のネットワーク）。
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
