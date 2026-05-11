import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getGeminiModelForPlan } from "@/lib/gemini-models";

const DEFAULT_FREE = "gemini-2.5-flash-lite";
const DEFAULT_PAID = "gemini-2.5-flash";

const ENV_KEYS = [
  "GEMINI_MODEL",
  "GEMINI_FREE_MODEL",
  "GEMINI_PAID_MODEL",
] as const;

describe("getGeminiModelForPlan", () => {
  let envSnapshot: Record<string, string | undefined>;

  beforeEach(() => {
    envSnapshot = {};
    for (const key of ENV_KEYS) {
      envSnapshot[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (envSnapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = envSnapshot[key];
      }
    }
  });

  it("uses plan defaults when no env is set", () => {
    expect(getGeminiModelForPlan("free")).toBe(DEFAULT_FREE);
    expect(getGeminiModelForPlan("paid")).toBe(DEFAULT_PAID);
  });

  it("uses GEMINI_MODEL as fallback for both plans when plan-specific vars are unset", () => {
    process.env.GEMINI_MODEL = "gemini-fallback";

    expect(getGeminiModelForPlan("free")).toBe("gemini-fallback");
    expect(getGeminiModelForPlan("paid")).toBe("gemini-fallback");
  });

  it("prefers GEMINI_FREE_MODEL over GEMINI_MODEL for free plan", () => {
    process.env.GEMINI_MODEL = "fallback";
    process.env.GEMINI_FREE_MODEL = "free-specific";

    expect(getGeminiModelForPlan("free")).toBe("free-specific");
  });

  it("prefers GEMINI_PAID_MODEL over GEMINI_MODEL for paid plan", () => {
    process.env.GEMINI_MODEL = "fallback";
    process.env.GEMINI_PAID_MODEL = "paid-specific";

    expect(getGeminiModelForPlan("paid")).toBe("paid-specific");
  });

  it("does not use the other plan's model when only one plan-specific var is set", () => {
    process.env.GEMINI_FREE_MODEL = "only-free";

    expect(getGeminiModelForPlan("free")).toBe("only-free");
    expect(getGeminiModelForPlan("paid")).toBe(DEFAULT_PAID);
  });

  it("trims whitespace from env values", () => {
    process.env.GEMINI_MODEL = "  trimmed-fallback  ";
    process.env.GEMINI_FREE_MODEL = "\tfree-edge\t";
    process.env.GEMINI_PAID_MODEL = " paid-edge ";

    expect(getGeminiModelForPlan("free")).toBe("free-edge");
    expect(getGeminiModelForPlan("paid")).toBe("paid-edge");
  });

  it("treats empty and whitespace-only values as unset (falls through)", () => {
    process.env.GEMINI_MODEL = "";
    process.env.GEMINI_FREE_MODEL = "   ";
    process.env.GEMINI_PAID_MODEL = "\t";

    expect(getGeminiModelForPlan("free")).toBe(DEFAULT_FREE);
    expect(getGeminiModelForPlan("paid")).toBe(DEFAULT_PAID);
  });

  it("falls back to GEMINI_MODEL when plan-specific value is blank after trim", () => {
    process.env.GEMINI_MODEL = "shared";
    process.env.GEMINI_FREE_MODEL = " ";

    expect(getGeminiModelForPlan("free")).toBe("shared");
  });
});
