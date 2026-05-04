const STATIC_CACHE_NAME = "cal-snap-static-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.webp",
];

function shouldBypassCache(url, request) {
  return (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname === "/login" ||
    url.pathname === "/signup" ||
    url.pathname === "/billing" ||
    url.pathname === "/dashboard" ||
    url.pathname === "/meals/new" ||
    url.pathname === "/profile" ||
    url.pathname === "/settings" ||
    url.pathname === "/suggestions"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || shouldBypassCache(url, event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (!STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
      );
    }),
  );
});
