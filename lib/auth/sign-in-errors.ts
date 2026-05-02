import type { AuthError } from "@supabase/supabase-js";

/** メール＋パスワードログイン失敗時のユーザー向けメッセージ（英語の生メッセージは出さない） */
export function mapSupabaseSignInError(error: AuthError): string {
  const code = error.code?.toLowerCase() ?? "";
  const msg = error.message?.toLowerCase() ?? "";

  if (code === "email_not_confirmed") {
    return "メールアドレスの確認が完了していません。登録時に届いたメールのリンクから確認してから、再度ログインしてください。";
  }

  if (msg.includes("email not confirmed") || (msg.includes("confirm") && msg.includes("email"))) {
    return "メールアドレスの確認が完了していません。登録時に届いたメールのリンクから確認してから、再度ログインしてください。";
  }

  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid_credentials")
  ) {
    return "メールアドレスまたはパスワードが正しくありません。未登録の場合は新規登録をお試しください。";
  }

  if (code === "user_not_found" || msg.includes("user not found")) {
    return "このメールアドレスは登録されていません。新規登録からアカウントを作成してください。";
  }

  if (code === "otp_expired" || msg.includes("expired")) {
    return "セッションの有効期限が切れています。もう一度お試しください。";
  }

  return "ログインに失敗しました。入力内容を確認するか、時間をおいて再度お試しください。";
}
