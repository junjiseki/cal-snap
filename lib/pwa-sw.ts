/** `public/sw-passive.js` の `STATIC_CACHE` と一致させること */
export const PASSIVE_SW_CACHE_VERSION = 14;
export const PASSIVE_SW_CACHE_NAME = `cal-snap-static-v${PASSIVE_SW_CACHE_VERSION}`;
export const PASSIVE_SW_PATH = "/sw-passive.js";
export const PASSIVE_SW_URL = `${PASSIVE_SW_PATH}?v=${PASSIVE_SW_CACHE_VERSION}`;

/** `public/sw-migrate.js` のクエリと一致させ、デプロイ後に確実に再取得させる */
export const PASSIVE_SW_MIGRATE_URL = "/sw-migrate.js?v=15";
