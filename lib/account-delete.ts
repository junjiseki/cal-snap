import type { Plan } from "@/lib/supabase/database.types";

/** アカウント削除の confirm() 用。有料時は Stripe 自動解約と失敗時の案内を出す。 */
export function getAccountDeleteConfirmMessage(
  plan: Plan | "free" | "paid",
): string {
  const base =
    "アカウントを削除すると、ログインできなくなり、紐づく食事記録などのデータは削除されます（お問い合わせ履歴のうち、メールアドレスのみ残る場合があります）。同じメールアドレスで新規登録し直すことはできます。この操作は取り消せません。";

  if (plan === "paid") {
    return [
      "【有料プラン】削除処理のなかで Stripe のサブスクリプションも自動解約します（再請求はされません）。",
      "解約に失敗した場合はアカウントは削除されずエラーになります。そのときは時間をおいて再度お試しいただくか、「料金・プラン」のサブスク管理から手動で解約してください。",
      "",
      base,
      "",
      "上記を理解したうえで削除しますか？",
    ].join("\n");
  }

  return `${base}\n\n続行しますか？`;
}
