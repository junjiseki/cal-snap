import { GoogleGenAI } from "@google/genai";
import {
  DailyAdviceSchema,
  type DailyAdviceMeal,
  buildDailyAdvicePrompt,
  createDailyAdvice,
  getTodayYmdInJapan,
} from "@/lib/daily-advice";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Plan } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const dailyAdviceJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["advice_text", "reason_text", "action_text"],
  properties: {
    advice_text: { type: "string" },
    reason_text: { type: "string" },
    action_text: { type: "string" },
  },
};

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

function getLast7DaysRangeInJapan() {
  const today = getTodayYmdInJapan();
  const end = new Date(`${today}T23:59:59.999+09:00`);
  const start = new Date(`${today}T00:00:00.000+09:00`);
  start.setDate(start.getDate() - 6);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function getOrCreateProfile(userId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("plan,daily_calorie_goal")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, plan: "free" })
    .select("plan,daily_calorie_goal")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  let profile: { plan: Plan; daily_calorie_goal: number };
  try {
    profile = await getOrCreateProfile(user.id);
  } catch {
    return errorResponse("プロフィールを取得できません。", 500, "PROFILE_FETCH_FAILED");
  }

  if (profile.plan !== "paid") {
    return errorResponse("AIアドバイスは有料プラン限定です。", 403, "PAID_PLAN_REQUIRED");
  }

  const { start, end } = getLast7DaysRangeInJapan();
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("eaten_at,total_calories,protein,fat,carbs,meal_items(name)")
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lte("eaten_at", end)
    .order("eaten_at", { ascending: true });

  if (mealsError) {
    return errorResponse("食事データを取得できません。", 500, "MEAL_FETCH_FAILED");
  }

  try {
    const result = await createDailyAdvice({
      plan: profile.plan,
      goalCalories: profile.daily_calorie_goal,
      meals: (meals ?? []) as unknown as DailyAdviceMeal[],
      generateAdvice: async (summary) => {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_NOT_CONFIGURED");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
        const response = await ai.models.generateContent({
          model,
          contents: [{ text: buildDailyAdvicePrompt(summary) }],
          config: {
            temperature: 0.35,
            responseMimeType: "application/json",
            responseJsonSchema: dailyAdviceJsonSchema,
          },
        });

        if (!response.text) {
          throw new Error("Gemini response was empty.");
        }

        return DailyAdviceSchema.parse(JSON.parse(response.text));
      },
    });

    if (result.status === "plan_required") {
      return errorResponse("AIアドバイスは有料プラン限定です。", 403, "PAID_PLAN_REQUIRED");
    }

    if (result.status === "insufficient_data") {
      return Response.json(result);
    }

    return Response.json({
      status: "ok",
      advice: result.advice,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GEMINI_NOT_CONFIGURED") {
      return errorResponse("GEMINI_API_KEY が設定されていません。", 500, "GEMINI_NOT_CONFIGURED");
    }
    console.error("[daily-advice]", error);
    return errorResponse("AIアドバイスを作成できません。", 502, "AI_ADVICE_FAILED");
  }
}
