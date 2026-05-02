import { describe, expect, it } from "vitest";
import {
  MealAnalysisSchema,
  MealRegistrationSchema,
  toConfidence,
  toInteger,
} from "@/lib/meal-analysis";

function validItem(overrides: Record<string, unknown> = {}) {
  return {
    name: "ごはん",
    estimated_amount: "1膳",
    calories: 200,
    protein: 4,
    fat: 0.5,
    carbs: 45,
    confidence: 0.9,
    ...overrides,
  };
}

function validAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    total_calories: 500,
    protein: 20,
    fat: 10,
    carbs: 60,
    ai_confidence: 0.85,
    memo: "昼食",
    items: [validItem()],
    ...overrides,
  };
}

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

describe("MealAnalysisSchema", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = MealAnalysisSchema.parse(validAnalysis());
    expect(parsed.items).toHaveLength(1);
    expect(parsed.total_calories).toBe(500);
  });

  it("rejects empty items array", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ items: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects more than 30 items", () => {
    const items = Array.from({ length: 31 }, (_, i) => validItem({ name: `item-${i}` }));
    const result = MealAnalysisSchema.safeParse(validAnalysis({ items }));
    expect(result.success).toBe(false);
  });

  it("rejects negative nutrition values", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ protein: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects total_calories above max", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ total_calories: 100_001 }));
    expect(result.success).toBe(false);
  });

  it("rejects empty trimmed item name", () => {
    const result = MealAnalysisSchema.safeParse(
      validAnalysis({ items: [validItem({ name: "   " })] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects item name longer than 80 chars", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ items: [validItem({ name: "x".repeat(81) })] }));
    expect(result.success).toBe(false);
  });

  it("rejects memo longer than 1000 chars", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ memo: "m".repeat(1001) }));
    expect(result.success).toBe(false);
  });

  it("rejects ai_confidence above 1", () => {
    const result = MealAnalysisSchema.safeParse(validAnalysis({ ai_confidence: 1.01 }));
    expect(result.success).toBe(false);
  });
});

describe("MealRegistrationSchema", () => {
  it("accepts valid ISO datetime for eaten_at", () => {
    const parsed = MealRegistrationSchema.parse({
      ...validAnalysis(),
      eaten_at: "2026-05-02T12:30:00.000Z",
    });
    expect(parsed.eaten_at).toBe("2026-05-02T12:30:00.000Z");
  });

  it("rejects invalid datetime string", () => {
    const result = MealRegistrationSchema.safeParse({
      ...validAnalysis(),
      eaten_at: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

