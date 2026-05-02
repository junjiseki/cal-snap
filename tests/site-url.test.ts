import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_APP_URL and strips trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com/");
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("falls back to https://VERCEL_URL when app URL unset", () => {
    vi.stubEnv("VERCEL_URL", "my-app.vercel.app");
    expect(getSiteUrl()).toBe("https://my-app.vercel.app");
  });

  it("defaults to localhost when no env set", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
