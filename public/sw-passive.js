/**
 * iPhone のホーム画面起動を速くするため、
 * 静的アセットのみ最小限キャッシュする。
 * API・認証系レスポンスはキャッシュしない。
 */
const STATIC_CACHE = "cal-snap-static-v2";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

function isCacheableStaticRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2)$/i.test(url.pathname) ||
    url.pathname === "/manifest.json"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // ネットワーク不安定時はプリキャッシュ失敗を許容する
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableStaticRequest(request)) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            void cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? fetchPromise;
    })(),
  );
});
