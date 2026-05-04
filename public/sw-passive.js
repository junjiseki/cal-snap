/**
 * キャッシュしない（常に fetch でネットワークへ）。
 * Chrome のインストール可否ヒューリスティック向けに fetch ハンドラのみ用意する。
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
