import type { Plan } from "@/lib/supabase/database.types";

/** アカウント削除の confirm() 用。有料時は Stripe 解約の案内を先に出す。 */
export function getAccountDeleteConfirmMessage(plan: Plan | "free" | "paid"): string {
  const base =
    "アカウントを削除すると、ログインできなくなり、紐づく食事記録などのデータは削除されます（お問い合わせ履歴のうち、メールアドレスのみ残る場合があります）。同じメールアドレスで新規登録し直すことはできます。この操作は取り消せません。";

  if (plan === "paid") {
    return [
      "【有料プラン】この画面からアカウントだけを削除しても、Stripe のサブスクリプションは自動では停止しません（次回以降の請求が続く可能性があります）。",
      "続ける前に「料金・プラン」ページの「サブスクの管理・解約」で解約を完了してください。",
      "",
      base,
      "",
      "上記を理解したうえで削除しますか？",
    ].join("\n");
  }

  return `${base}\n\n続行しますか？`;
}
