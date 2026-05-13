import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  absoluteSiteUrl,
  getSiteUrl,
  siteHomeAbsoluteUrl,
} from "@/lib/site-url";

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

describe("absoluteSiteUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves /logo.png against NEXT_PUBLIC_APP_URL (no trailing slash on base)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(absoluteSiteUrl("/logo.png")).toBe("https://example.com/logo.png");
  });

  it("resolves pathnames when NEXT_PUBLIC_APP_URL has trailing slash (stripped by getSiteUrl)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://cdn.example.com/");
    expect(absoluteSiteUrl("/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("resolves against https://VERCEL_URL when app URL unset", () => {
    vi.stubEnv("VERCEL_URL", "my-app.vercel.app");
    expect(absoluteSiteUrl("/logo.png")).toBe(
      "https://my-app.vercel.app/logo.png",
    );
  });

  it("resolves against localhost when no env set", () => {
    expect(absoluteSiteUrl("/logo.png")).toBe("http://localhost:3000/logo.png");
  });
});

describe("siteHomeAbsoluteUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns home URL with trailing slash for NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    expect(siteHomeAbsoluteUrl()).toBe("https://example.com/");
  });

  it("returns home URL with trailing slash for VERCEL_URL fallback", () => {
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(siteHomeAbsoluteUrl()).toBe("https://preview.vercel.app/");
  });

  it("returns home URL with trailing slash for localhost default", () => {
    expect(siteHomeAbsoluteUrl()).toBe("http://localhost:3000/");
  });
});
