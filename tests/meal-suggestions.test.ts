import { describe, expect, it } from "vitest";
import {
  MealSuggestionMenuSchema,
  MealSuggestionRequestSchema,
  MealSuggestionResponseSchema,
} from "@/lib/meal-suggestions";

function validMenu(overrides: Record<string, unknown> = {}) {
  return {
    title: "寿司10貫セット",
    reason: "外食で満足感を出しつつPFCを整えやすい",
    items: ["寿司10貫", "あさり汁"],
    estimated_calories: 720,
    protein: 28,
    fat: 12,
    carbs: 95,
    adjustment_tip: "夜は炭水化物を少し抑えると調整しやすいです。",
    ...overrides,
  };
}

function validResponse(overrides: Record<string, unknown> = {}) {
  return {
    summary: "今日の残りカロリーに合わせた外食候補です。",
    suggestions: [validMenu(), validMenu({ title: "定食B" }), validMenu({ title: "定食C" })],
    ...overrides,
  };
}

describe("MealSuggestionRequestSchema", () => {
  it("accepts valid context and slot", () => {
    const parsed = MealSuggestionRequestSchema.parse({
      context: "eat_out",
      slot: "lunch",
    });
    expect(parsed.context).toBe("eat_out");
    expect(parsed.slot).toBe("lunch");
  });

  it("rejects invalid context", () => {
    const result = MealSuggestionRequestSchema.safeParse({
      context: "invalid",
      slot: "lunch",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slot", () => {
    const result = MealSuggestionRequestSchema.safeParse({
      context: "cook",
      slot: "brunch",
    });
    expect(result.success).toBe(false);
  });
});

describe("MealSuggestionMenuSchema", () => {
  it("accepts a minimal valid menu", () => {
    const parsed = MealSuggestionMenuSchema.parse(validMenu());
    expect(parsed.title).toBe("寿司10貫セット");
  });

  it("rejects empty title", () => {
    const result = MealSuggestionMenuSchema.safeParse(validMenu({ title: "   " }));
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 80 chars", () => {
    const result = MealSuggestionMenuSchema.safeParse(validMenu({ title: "x".repeat(81) }));
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = MealSuggestionMenuSchema.safeParse(validMenu({ items: [] }));
    expect(result.success).toBe(false);
  });

  it("rejects more than 8 items", () => {
    const items = Array.from({ length: 9 }, (_, i) => `item-${i}`);
    const result = MealSuggestionMenuSchema.safeParse(validMenu({ items }));
    expect(result.success).toBe(false);
  });

  it("rejects negative macros", () => {
    const result = MealSuggestionMenuSchema.safeParse(validMenu({ protein: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects estimated_calories above max", () => {
    const result = MealSuggestionMenuSchema.safeParse(
      validMenu({ estimated_calories: 100_001 }),
    );
    expect(result.success).toBe(false);
  });
});

describe("MealSuggestionResponseSchema", () => {
  it("accepts three suggestions", () => {
    const parsed = MealSuggestionResponseSchema.parse(validResponse());
    expect(parsed.suggestions).toHaveLength(3);
  });

  it("rejects empty suggestions", () => {
    const result = MealSuggestionResponseSchema.safeParse(
      validResponse({ suggestions: [] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 suggestions", () => {
    const suggestions = [
      validMenu({ title: "A" }),
      validMenu({ title: "B" }),
      validMenu({ title: "C" }),
      validMenu({ title: "D" }),
    ];
    const result = MealSuggestionResponseSchema.safeParse(validResponse({ suggestions }));
    expect(result.success).toBe(false);
  });

  it("rejects summary longer than 360 chars", () => {
    const result = MealSuggestionResponseSchema.safeParse(
      validResponse({ summary: "s".repeat(361) }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects nested invalid menu", () => {
    const result = MealSuggestionResponseSchema.safeParse(
      validResponse({ suggestions: [validMenu({ title: "" })] }),
    );
    expect(result.success).toBe(false);
  });
});
