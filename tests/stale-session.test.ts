import { describe, expect, it } from "vitest";
import { isStaleRefreshTokenError } from "@/lib/supabase/stale-session";

describe("isStaleRefreshTokenError", () => {
  it("returns true for refresh_token_not_found code", () => {
    expect(
      isStaleRefreshTokenError({
        message: "x",
        code: "refresh_token_not_found",
        status: 400,
      } as never),
    ).toBe(true);
  });

  it("returns true when message mentions invalid refresh token", () => {
    expect(
      isStaleRefreshTokenError({
        message: "Invalid Refresh Token: token revoked",
        status: 400,
      } as never),
    ).toBe(true);
  });

  it("returns true for Refresh Token Not Found wording", () => {
    expect(
      isStaleRefreshTokenError({
        message: "Refresh Token Not Found",
        status: 400,
      } as never),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isStaleRefreshTokenError(null)).toBe(false);
    expect(isStaleRefreshTokenError({ message: "Invalid login credentials" } as never)).toBe(false);
  });
});
