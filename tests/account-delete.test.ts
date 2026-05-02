import { describe, expect, it } from "vitest";
import { getAccountDeleteConfirmMessage } from "@/lib/account-delete";

describe("getAccountDeleteConfirmMessage", () => {
  it("includes re-registration and data deletion notice for free plan", () => {
    const text = getAccountDeleteConfirmMessage("free");
    expect(text).toContain("同じメールアドレスで新規登録");
    expect(text).toContain("食事記録");
    expect(text).toContain("続行しますか？");
    expect(text).not.toContain("【有料プラン】");
  });

  it("prepends Stripe warning for paid plan", () => {
    const text = getAccountDeleteConfirmMessage("paid");
    expect(text).toContain("【有料プラン】");
    expect(text).toContain("Stripe");
    expect(text).toContain("サブスクの管理・解約");
    expect(text).toContain("同じメールアドレスで新規登録");
    expect(text).toContain("上記を理解したうえで削除しますか？");
  });
});
