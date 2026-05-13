/**
 * iPhone のホーム画面起動を速くするため、
 * 静的アセットのみ最小限キャッシュする。
 * API・認証系レスポンスはキャッシュしない。
 * ヒット時はキャッシュを即返しつつバックグラウンドで再取得（stale-while-revalidate）。
 */
const STATIC_CACHE = "cal-snap-static-v11";
/**
 * iOS「ホーム画面に追加」は apple-touch-icon を取る際、SW が fetch を横取りすると
 * キャッシュの空応答・古い失敗レスポンスで画像が取れず、サイト名の頭文字（例: カ）だけのアイコンになることがある。
 * そのため PWA 用アイコンと manifest は SW 経由にせずブラウザの直接取得に任せる。
 */
const APP_SHELL = [];

/** lib/pwa-static-icon-paths.ts の PWA_SHORT_CACHE_PATHS と一致させること */
const PWA_SHORT_CACHE_PATHS = [
  "/apple-touch-icon.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/icon-192.png",
  "/icon-512.png",
];

function isCacheableStaticRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return false;
  if (url.pathname === "/manifest.json" || PWA_SHORT_CACHE_PATHS.includes(url.pathname)) {
    return false;
  }
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2)$/i.test(url.pathname)
  );
}

self.addEventListener("install", (event) => {
  if (APP_SHELL.length > 0) {
    event.waitUntil(
      caches
        .open(STATIC_CACHE)
        .then((cache) => cache.addAll(APP_SHELL))
        .catch(() => {
          // ネットワーク不安定時はプリキャッシュ失敗を許容する
        }),
    );
  }
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
      const updateCache = (response) => {
        if (response.ok) {
          void cache.put(request, response.clone());
        }
      };

      // キャッシュがあれば即返しつつ、バックグラウンドで更新（stale-while-revalidate）
      if (cached) {
        void fetch(request)
          .then(updateCache)
          .catch(() => {});
        return cached;
      }

      try {
        const response = await fetch(request);
        updateCache(response);
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "食事の時間です";
  const url = data.url || "/meals/new";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "写真を撮って、食事を記録しましょう。",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "meal-reminder",
      renotify: true,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/meals/new";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = clientList.find((client) => {
        try {
          return new URL(client.url).pathname === new URL(url, self.location.origin).pathname;
        } catch {
          return false;
        }
      });

      if (existing) {
        await existing.focus();
        return;
      }

      await self.clients.openWindow(url);
    })(),
  );
});
