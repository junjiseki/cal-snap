import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "@/lib/security/request";

function req(method: string, headers: Record<string, string>) {
  return new Request("https://app.test/api/example", { method, headers });
}

describe("isAllowedOrigin", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows non-mutating methods without origin checks", () => {
    expect(isAllowedOrigin(req("GET", {}))).toBe(true);
    expect(isAllowedOrigin(req("HEAD", { Origin: "https://evil.test" }))).toBe(
      true,
    );
    expect(isAllowedOrigin(req("OPTIONS", {}))).toBe(true);
  });

  it("allows POST when Origin matches NEXT_PUBLIC_APP_URL", () => {
    expect(
      isAllowedOrigin(
        req("POST", {
          Origin: "https://app.test",
        }),
      ),
    ).toBe(true);
  });

  it("allows PATCH and DELETE when Origin matches", () => {
    expect(isAllowedOrigin(req("PATCH", { Origin: "https://app.test" }))).toBe(
      true,
    );
    expect(isAllowedOrigin(req("DELETE", { Origin: "https://app.test" }))).toBe(
      true,
    );
    expect(isAllowedOrigin(req("PUT", { Origin: "https://app.test" }))).toBe(
      true,
    );
  });

  it("rejects POST when Origin differs from expected", () => {
    expect(
      isAllowedOrigin(
        req("POST", {
          Origin: "https://evil.test",
        }),
      ),
    ).toBe(false);
  });

  it("uses Referer when Origin is absent", () => {
    expect(
      isAllowedOrigin(
        req("POST", {
          Referer: "https://app.test/dashboard",
        }),
      ),
    ).toBe(true);
  });

  it("rejects when Referer origin differs", () => {
    expect(
      isAllowedOrigin(
        req("POST", {
          Referer: "https://evil.test/page",
        }),
      ),
    ).toBe(false);
  });

  it("rejects mutating request when neither Origin nor Referer yields a match", () => {
    expect(isAllowedOrigin(req("POST", {}))).toBe(false);
  });

  describe("without NEXT_PUBLIC_APP_URL (forwarded host / proto)", () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it("builds expected origin from x-forwarded-host and x-forwarded-proto", () => {
      expect(
        isAllowedOrigin(
          new Request("http://internal/api", {
            method: "POST",
            headers: {
              Origin: "https://edge.example",
              "x-forwarded-host": "edge.example",
              "x-forwarded-proto": "https",
            },
          }),
        ),
      ).toBe(true);
    });

    it("defaults proto to http when x-forwarded-proto is missing", () => {
      expect(
        isAllowedOrigin(
          new Request("http://localhost:3000/api", {
            method: "POST",
            headers: {
              Origin: "http://localhost:3000",
              host: "localhost:3000",
            },
          }),
        ),
      ).toBe(true);
    });

    it("rejects when actual origin does not match forwarded-derived expected", () => {
      expect(
        isAllowedOrigin(
          new Request("http://internal/api", {
            method: "POST",
            headers: {
              Origin: "https://attacker.example",
              "x-forwarded-host": "edge.example",
              "x-forwarded-proto": "https",
            },
          }),
        ),
      ).toBe(false);
    });
  });

  describe("invalid NEXT_PUBLIC_APP_URL falls back to host headers", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-valid-url!!!");
    });

    it("uses host when configured URL is unusable", () => {
      expect(
        isAllowedOrigin(
          new Request("http://localhost:3000/api", {
            method: "POST",
            headers: {
              Origin: "http://localhost:3000",
              host: "localhost:3000",
            },
          }),
        ),
      ).toBe(true);
    });
  });
});
