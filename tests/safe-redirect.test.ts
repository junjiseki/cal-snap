import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

describe("safeInternalPath", () => {
  it("allows same-origin style relative paths", () => {
    expect(safeInternalPath("/dashboard", "/")).toBe("/dashboard");
    expect(safeInternalPath("/meals/new?foo=1", "/")).toBe("/meals/new?foo=1");
  });

  it("rejects external URLs and protocol-relative paths", () => {
    expect(safeInternalPath("https://evil.test/phish", "/fallback")).toBe("/fallback");
    expect(safeInternalPath("//evil.test/phish", "/fallback")).toBe("/fallback");
    expect(safeInternalPath("/\\evil.test", "/fallback")).toBe("/fallback");
  });

  it("rejects paths that smuggle schemes", () => {
    expect(safeInternalPath("/https://evil.test", "/fallback")).toBe("/fallback");
  });

  it("uses fallback for empty or invalid", () => {
    expect(safeInternalPath(null, "/home")).toBe("/home");
    expect(safeInternalPath("", "/home")).toBe("/home");
    expect(safeInternalPath("dashboard", "/home")).toBe("/home");
  });

  it("rejects paths containing NUL", () => {
    expect(safeInternalPath("/dash\0board", "/fallback")).toBe("/fallback");
  });

  it("trims whitespace and allows valid internal path", () => {
    expect(safeInternalPath("  /profile  ", "/")).toBe("/profile");
  });
});
