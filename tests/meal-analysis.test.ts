import { describe, expect, it } from "vitest";
import { toConfidence, toInteger } from "@/lib/meal-analysis";

describe("meal-analysis helpers", () => {
  it("toInteger should round and clamp to zero", () => {
    expect(toInteger(123.6)).toBe(124);
    expect(toInteger(0.2)).toBe(0);
    expect(toInteger(-10)).toBe(0);
  });

  it("toConfidence should clamp between 0 and 1", () => {
    expect(toConfidence(0.555)).toBe(0.56);
    expect(toConfidence(1.2)).toBe(1);
    expect(toConfidence(-0.1)).toBe(0);
  });
});
