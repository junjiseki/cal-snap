/**
 * オープンリダイレクト防止: 同一オリジン内の相対パスのみ許可する。
 */
export function safeInternalPath(next: string | null, fallback: string): string {
  if (!next) {
    return fallback;
  }
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }
  if (trimmed.includes("\0")) {
    return fallback;
  }
  // パブリックホーム（/）はログイン直後の遷移先にしない。Cookie 反映前の SSR で
  // 未ログイン扱いになり、ランディングが表示されうる。
  if (trimmed === "/") {
    return fallback;
  }
  return trimmed;
}
