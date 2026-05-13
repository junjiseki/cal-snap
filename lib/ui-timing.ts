/** アプリヘッダー: モバイルメニュー内で遷移したあと閉じるまでの短い遅延 */
export const APP_HEADER_MOBILE_MENU_CLOSE_DELAY_MS = 120;

/** 摂取カロリーオンボーディング: モーダルを開くまでの遅延 */
export const CALORIE_GOAL_ONBOARDING_OPEN_DELAY_MS = 500;

/**
 * 初期描画完了後に実行する軽い処理（セッション掃除・PWA プロンプト等）向け。
 * `requestIdleCallback` の timeout。
 */
export const DEFER_AFTER_LOAD_IDLE_TIMEOUT_MS = 2500;

/** 上記の `requestIdleCallback` 非対応時の `setTimeout` フォールバック */
export const DEFER_AFTER_LOAD_SETTIMEOUT_FALLBACK_MS = 1200;

/**
 * Service Worker レガシー掃除（キャッシュ削除等）向け。
 * 通常の defer より長めに取る。
 */
export const SW_LEGACY_CLEANUP_IDLE_TIMEOUT_MS = 3000;

/** Service Worker レガシー掃除の idle 非対応時フォールバック */
export const SW_LEGACY_CLEANUP_SETTIMEOUT_FALLBACK_MS = 1500;

/** Turnstile スクリプトが window に現れるまで待つ上限 */
export const TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS = 12_000;
