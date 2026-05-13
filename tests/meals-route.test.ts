import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserMock = vi.fn();

vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/supabase/server")>();
  return {
    ...mod,
    getAuthenticatedUser: getAuthenticatedUserMock,
  };
});

vi.mock("@/lib/security/request", () => ({
  isAllowedOrigin: vi.fn(() => true),
  forbiddenOriginResponse: vi.fn(() => new Response(null, { status: 403 })),
}));

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MEAL_ID = "aa0e8400-e29b-41d4-a716-446655440000";

function validMealBody() {
  return {
    // MealRegistrationSchema は z.string().datetime()（Z 終端の ISO）を要求
    eaten_at: "2026-05-11T03:00:00.000Z",
    total_calories: 500,
    protein: 20,
    fat: 10,
    carbs: 60,
    ai_confidence: 0.9,
    memo: "テスト",
    items: [
      {
        name: "定食",
        estimated_amount: "1人前",
        calories: 500,
        protein: 20,
        fat: 10,
        carbs: 60,
        confidence: 0.9,
      },
    ],
  };
}

function createMockSupabase(reminderSettingsError: {
  message: string;
  code: string;
}) {
  const mealsChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockResolvedValue({ count: 0, error: null }),
  };

  const reminderChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi
      .fn()
      .mockImplementationOnce(() => reminderChain)
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: null,
          error: reminderSettingsError,
        }),
      ),
  };

  const from = vi.fn((table: string) => {
    if (table === "meals") return mealsChain;
    if (table === "meal_reminder_settings") return reminderChain;
    throw new Error(`unexpected from("${table}")`);
  });

  const rpc = vi.fn().mockResolvedValue({
    data: MEAL_ID,
    error: null,
  });

  return { from, rpc };
}

describe("POST /api/meals", () => {
  beforeEach(() => {
    getAuthenticatedUserMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns and still succeeds when meal_reminder_settings fetch fails", async () => {
    const reminderErr = {
      message: "reminder settings unavailable",
      code: "TEST",
    };
    const { from, rpc } = createMockSupabase(reminderErr);

    getAuthenticatedUserMock.mockResolvedValue({
      user: { id: USER_ID },
      supabase: { from, rpc },
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { POST } = await import("@/app/api/meals/route");
    const res = await POST(
      new Request("http://localhost/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validMealBody()),
      }),
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { mealId: string };
    expect(json).toEqual({ mealId: MEAL_ID });

    expect(warnSpy).toHaveBeenCalledWith(
      "[meals] reminder settings fetch failed",
      reminderErr,
    );

    expect(from).toHaveBeenCalledWith("meals");
    expect(from).toHaveBeenCalledWith("meal_reminder_settings");
    expect(from).not.toHaveBeenCalledWith("meal_reminder_logs");
  });
});
