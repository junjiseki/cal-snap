import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateTurnstileToken } from "@/lib/security/turnstile";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("https://app.test/api/contact", {
    method: "POST",
    headers,
  });
}

describe("validateTurnstileToken", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "unit-test-secret");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns not_configured when secret is absent in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const result = await validateTurnstileToken("token", makeRequest());
    expect(result).toEqual({ ok: false, code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses dev fallback secret when unset outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await validateTurnstileToken("valid-token", makeRequest());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(init.body).toBe(
      "secret=1x0000000000000000000000000000000AA&response=valid-token",
    );
  });

  it("sends application/x-www-form-urlencoded with secret, response, and optional remoteip", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_WIDGET", "true");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await validateTurnstileToken("tok", makeRequest({ "cf-connecting-ip": "203.0.113.5" }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = String(init.body);
    expect(body).toContain("secret=unit-test-secret");
    expect(body).toContain("response=tok");
    expect(body).toContain("remoteip=203.0.113.5");
  });

  it("returns invalid for empty or oversized token", async () => {
    expect(await validateTurnstileToken("", makeRequest())).toEqual({
      ok: false,
      code: "invalid",
    });
    expect(await validateTurnstileToken("   ", makeRequest())).toEqual({
      ok: false,
      code: "invalid",
    });
    expect(await validateTurnstileToken("x".repeat(2049), makeRequest())).toEqual({
      ok: false,
      code: "invalid",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns invalid when siteverify reports success: false", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });

    const result = await validateTurnstileToken("bad-token", makeRequest());
    expect(result).toEqual({ ok: false, code: "invalid" });
  });

  it("returns request_failed when HTTP status is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    const result = await validateTurnstileToken("tok", makeRequest());
    expect(result).toEqual({ ok: false, code: "request_failed" });
  });

  it("returns request_failed when response JSON does not match schema", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ unexpected: true }),
    });

    const result = await validateTurnstileToken("tok", makeRequest());
    expect(result).toEqual({ ok: false, code: "request_failed" });
  });

  it("returns request_failed when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const result = await validateTurnstileToken("tok", makeRequest());
    expect(result).toEqual({ ok: false, code: "request_failed" });
  });

  it("returns ok when siteverify succeeds", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await validateTurnstileToken("good-token", makeRequest());
    expect(result).toEqual({ ok: true });
  });
});
