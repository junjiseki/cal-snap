/** `public/sw-passive.js` の `STATIC_CACHE` と一致させること */
export const PASSIVE_SW_CACHE_VERSION = 14;
export const PASSIVE_SW_CACHE_NAME = `cal-snap-static-v${PASSIVE_SW_CACHE_VERSION}`;
export const PASSIVE_SW_PATH = "/sw-passive.js";
export const PASSIVE_SW_URL = `${PASSIVE_SW_PATH}?v=${PASSIVE_SW_CACHE_VERSION}`;

/** `public/sw-migrate.js` のクエリと一致させ、デプロイ後に確実に再取得させる */
export const PASSIVE_SW_MIGRATE_URL = "/sw-migrate.js?v=18";

/**
 * React / `/_next/static` より前に実行する SW 解除（旧 SW が JS を横取りする端末向け）。
 * 非同期だが、controller 検出後すぐ unregister → reload する。
 */
export const PASSIVE_SW_INLINE_MIGRATION_SCRIPT = `(function(){try{if(!("serviceWorker"in navigator))return;if(!navigator.serviceWorker.controller)return;navigator.serviceWorker.getRegistrations().then(function(r){return Promise.all(r.map(function(x){return x.unregister()}))}).then(function(){if(!("caches"in window))return;return caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n.indexOf("cal-snap-")===0}).map(function(n){return caches.delete(n)}))})}).then(function(){location.replace(location.href.split("#")[0])})}catch(e){}})();`;
