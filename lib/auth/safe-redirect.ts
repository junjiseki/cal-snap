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
  return trimmed;
}
