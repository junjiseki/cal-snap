/**
 * 古い Service Worker / Cache Storage を React 読み込み前に一度だけ解除する。
 * `lib/pwa-sw.ts` の PASSIVE_SW_MIGRATION_FLAG と一致させること。
 */
(function () {
  try {
    var FLAG = "cal-snap:sw-v14-migrate";
    if (localStorage.getItem(FLAG) === "1") return;
    if (!("serviceWorker" in navigator)) {
      localStorage.setItem(FLAG, "1");
      return;
    }
    navigator.serviceWorker
      .getRegistrations()
      .then(function (regs) {
        var hadRegs = regs.length > 0;
        return Promise.all(regs.map(function (r) {
          return r.unregister();
        })).then(function () {
          return hadRegs;
        });
      })
      .then(function (hadRegs) {
        if (!("caches" in window)) {
          return { hadRegs: hadRegs, hadCaches: false };
        }
        return caches.keys().then(function (keys) {
          var legacy = keys.filter(function (k) {
            return k.indexOf("cal-snap-") === 0;
          });
          return Promise.all(
            legacy.map(function (k) {
              return caches.delete(k);
            }),
          ).then(function () {
            return { hadRegs: hadRegs, hadCaches: legacy.length > 0 };
          });
        });
      })
      .then(function (s) {
        localStorage.setItem(FLAG, "1");
        if (s.hadRegs || s.hadCaches) location.reload();
      })
      .catch(function () {
        try {
          localStorage.setItem(FLAG, "1");
        } catch (e) {}
      });
  } catch (e) {}
})();
