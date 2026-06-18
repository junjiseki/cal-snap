/**
 * 旧 Service Worker が `/_next/static/` を横取りしている端末向け（外部 .js フォールバック）。
 * 主処理は proxy.ts の Clear-Site-Data。HTML インライン版は lib/pwa-sw.ts。
 */
(function () {
  try {
    if (!("serviceWorker" in navigator)) return;
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker
      .getRegistrations()
      .then(function (regs) {
        return Promise.all(
          regs.map(function (r) {
            return r.unregister();
          }),
        );
      })
      .then(function () {
        if (!("caches" in window)) return;
        return caches.keys().then(function (keys) {
          return Promise.all(
            keys
              .filter(function (k) {
                return k.indexOf("cal-snap-") === 0;
              })
              .map(function (k) {
                return caches.delete(k);
              }),
          );
        });
      })
      .then(function () {
        location.replace(location.href.split("#")[0]);
      });
  } catch (e) {}
})();
