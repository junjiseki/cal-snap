/**
 * Cloudflare Turnstile のドキュメント掲載テスト用キー（`next dev` のデフォルト）。
 * 本番ウィジェットはホスト名制限などで localhost 上で 400020 になりやすい。
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

/**
 * 本番ビルド、または `NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_WIDGET=true` のときだけ
 * `.env` の本番用サイトキー／シークレットを使う。
 */
export function isTurnstileProductionWidgetMode(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_WIDGET === "true"
  );
}

/** ブラウザの Turnstile ウィジェットに渡すサイトキー */
export function getTurnstileSiteKeyForBrowser(): string {
  if (isTurnstileProductionWidgetMode()) {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  }
  return TURNSTILE_TEST_SITE_KEY;
}
