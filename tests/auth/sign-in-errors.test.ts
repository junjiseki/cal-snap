import { describe, expect, it } from "vitest";
import { mapSupabaseSignInError } from "@/lib/auth/sign-in-errors";

function err(partial: { message: string; code?: string; status?: number }) {
  return partial as Parameters<typeof mapSupabaseSignInError>[0];
}

describe("mapSupabaseSignInError", () => {
  it("maps invalid credentials to a Japanese validation message", () => {
    const text = mapSupabaseSignInError(
      err({ message: "Invalid login credentials", code: "invalid_credentials", status: 400 }),
    );
    expect(text).toContain("メールアドレスまたはパスワード");
    expect(text).toContain("未登録");
  });

  it("maps email not confirmed", () => {
    const text = mapSupabaseSignInError(
      err({ message: "Email not confirmed", code: "email_not_confirmed", status: 400 }),
    );
    expect(text).toContain("確認が完了していません");
  });
});
