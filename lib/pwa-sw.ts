/** `public/sw-passive.js` の `STATIC_CACHE` と一致させること */
export const PASSIVE_SW_CACHE_VERSION = 14;
export const PASSIVE_SW_CACHE_NAME = `cal-snap-static-v${PASSIVE_SW_CACHE_VERSION}`;
export const PASSIVE_SW_PATH = "/sw-passive.js";
export const PASSIVE_SW_URL = `${PASSIVE_SW_PATH}?v=${PASSIVE_SW_CACHE_VERSION}`;

/** 古い SW（`/_next/` 横取り版）を一度だけ解除する。`public/sw-migrate.js` と一致させること */
export const PASSIVE_SW_MIGRATION_FLAG = "cal-snap:sw-v14-migrate";
