import type { AuthError } from "@supabase/supabase-js";

/** クッキーに残った無効なリフレッシュトークン（DB リセット・別環境切替など） */
export function isStaleRefreshTokenError(error: unknown): error is AuthError {
  if (!error || typeof error !== "object") return false;
  const e = error as AuthError;
  if (e.code === "refresh_token_not_found") return true;
  const msg = typeof e.message === "string" ? e.message : "";
  return (
    msg.includes("Invalid Refresh Token") ||
    msg.includes("Refresh Token Not Found")
  );
}
