import { GoogleGenAI } from "@google/genai";
import { getGeminiModelForPlan } from "@/lib/gemini-models";
import {
  MEAL_SUGGESTION_DAILY_LIMIT,
  MealSuggestionRequestSchema,
  MealSuggestionResponseSchema,
  getTodaySuggestionUsageRange,
  mealSuggestionContextLabels,
  mealSuggestionSlotLabels,
} from "@/lib/meal-suggestions";
import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Plan } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

const suggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "suggestions"],
  properties: {
    summary: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "reason",
          "items",
          "estimated_calories",
          "protein",
          "fat",
          "carbs",
          "adjustment_tip",
        ],
        properties: {
          title: { type: "string" },
          reason: { type: "string" },
          items: {
            type: "array",
            items: { type: "string" },
          },
          estimated_calories: { type: "number" },
          protein: { type: "number" },
          fat: { type: "number" },
          carbs: { type: "number" },
          adjustment_tip: { type: "string" },
        },
      },
    },
  },
};

type RecentMeal = {
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  memo: string | null;
  meal_items?: {
    name: string;
    estimated_amount: string;
    calories: number;
  }[];
};

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

async function getProfile(userId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("plan,daily_calorie_goal")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, plan: "free" })
    .select("plan,daily_calorie_goal")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created;
}

async function getTodayUsage(userId: string, plan: Plan) {
  if (plan !== "paid") {
    return {
      used: 0,
      limit: 0,
      remaining: 0,
    };
  }

  const { supabase } = await getAuthenticatedUser();
  const { start, endExclusive } = getTodaySuggestionUsageRange();
  const { count, error } = await supabase
    .from("meal_suggestion_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("success", true)
    .gte("suggested_at", start)
    .lt("suggested_at", endExclusive);

  if (error) {
    throw error;
  }

  const used = count ?? 0;
  return {
    used,
    limit: MEAL_SUGGESTION_DAILY_LIMIT,
    remaining: Math.max(0, MEAL_SUGGESTION_DAILY_LIMIT - used),
  };
}

function formatRecentMeals(meals: RecentMeal[]) {
  if (meals.length === 0) {
    return "過去の食事データはまだありません。一般的な健康的な食事提案をしてください。";
  }

  return meals
    .slice(0, 30)
    .map((meal) => {
      const itemText =
        meal.meal_items
          ?.slice(0, 8)
          .map((item) => `${item.name} ${item.estimated_amount} ${item.calories}kcal`)
          .join(" / ") || "明細なし";
      const eatenAt = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(meal.eaten_at));
      return [
        `日時: ${eatenAt}`,
        `合計: ${meal.total_calories}kcal P${meal.protein} F${meal.fat} C${meal.carbs}`,
        `内容: ${itemText}`,
        meal.memo ? `メモ: ${meal.memo}` : null,
      ]
        .filter(Boolean)
        .join(" / ");
    })
    .join("\n");
}

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  try {
    const profile = await getProfile(user.id);
    const usage = await getTodayUsage(user.id, profile.plan);
    return Response.json({ plan: profile.plan, usage });
  } catch {
    return errorResponse("利用状況を取得できません。", 500, "USAGE_FETCH_FAILED");
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  if (!process.env.GEMINI_API_KEY) {
    return errorResponse(
      "GEMINI_API_KEY が設定されていません。",
      500,
      "GEMINI_NOT_CONFIGURED",
    );
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch {
    return errorResponse(
      "SUPABASE_SECRET_KEY が設定されていません。",
      500,
      "SUPABASE_ADMIN_NOT_CONFIGURED",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const parsed = MealSuggestionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("提案条件を確認してください。", 400, "VALIDATION_FAILED");
  }

  let profile: { plan: Plan; daily_calorie_goal: number };
  try {
    profile = await getProfile(user.id);
  } catch {
    return errorResponse("プロフィールを取得できません。", 500, "PROFILE_FETCH_FAILED");
  }

  if (profile.plan !== "paid") {
    return errorResponse("食事提案は有料プラン限定です。", 403, "PAID_PLAN_REQUIRED");
  }

  let usage;
  try {
    usage = await getTodayUsage(user.id, profile.plan);
  } catch {
    return errorResponse("提案回数を確認できません。", 500, "LIMIT_CHECK_FAILED");
  }

  if (usage.used >= usage.limit) {
    return errorResponse(
      `本日の提案上限に達しました。有料プランは1日${usage.limit}回までです。`,
      429,
      "SUGGESTION_LIMIT_EXCEEDED",
    );
  }

  const model = getGeminiModelForPlan(profile.plan);
  const { start, endExclusive } = getTodaySuggestionUsageRange();
  const { data: claim, error: claimError } = await supabase.rpc(
    "claim_meal_suggestion_slot",
    {
      p_user_id: user.id,
      p_model: model,
      p_context: parsed.data.context,
      p_meal_slot: parsed.data.slot,
      p_daily_limit: usage.limit,
      p_day_start: start,
      p_day_end: endExclusive,
    },
  );

  if (claimError) {
    console.error("[meal-suggestions] slot claim failed", claimError);
    const message =
      claimError.code === "PGRST202" || claimError.message.includes("schema cache")
        ? "食事提案用のDB migrationが未適用です。migrationを適用してから再試行してください。"
        : "提案枠を確保できません。";
    return errorResponse(message, 500, "LOG_CREATE_FAILED");
  }

  const claimedSlot = claim?.[0];
  if (!claimedSlot) {
    return errorResponse(
      `本日の提案上限に達しました。有料プランは1日${usage.limit}回までです。`,
      429,
      "SUGGESTION_LIMIT_EXCEEDED",
    );
  }

  const { data: recentMeals, error: mealsError } = await supabase
    .from("meals")
    .select(
      "eaten_at,total_calories,protein,fat,carbs,memo,meal_items(name,estimated_amount,calories)",
    )
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: false })
    .limit(30);

  if (mealsError) {
    await supabaseAdmin
      .from("meal_suggestion_logs")
      .delete()
      .eq("id", claimedSlot.log_id)
      .eq("user_id", user.id);
    return errorResponse("過去の食事データを取得できません。", 500, "MEAL_FETCH_FAILED");
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const contextLabel = mealSuggestionContextLabels[parsed.data.context];
    const slotLabel = mealSuggestionSlotLabels[parsed.data.slot];
    const recentMealText = formatRecentMeals((recentMeals ?? []) as unknown as RecentMeal[]);

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          text: [
            "You are a Japanese diet meal planner.",
            "Return JSON only, matching the supplied schema.",
            "All string values in the JSON MUST be written in Japanese.",
            "Keep JSON property names exactly as the schema defines; only translate values.",
            "Do not recommend extreme restriction. Keep suggestions realistic and easy to choose.",
            "Use the user's recent meals to infer preferences, common calorie range, and foods they often eat.",
            "提案は日本語で、具体的なメニュー名と量が想像できる内容にしてください。",
            `ユーザーの1日の摂取カロリー目安: ${profile.daily_calorie_goal}kcal`,
            `希望シーン: ${contextLabel}`,
            `対象の食事: ${slotLabel}`,
            `過去の食事データ:\n${recentMealText}`,
            "候補を3つ出してください。各候補は、好きな物を完全に禁止せず、1日の中で調整しやすい提案にしてください。",
          ].join("\n"),
        },
      ],
      config: {
        temperature: 0.45,
        responseMimeType: "application/json",
        responseJsonSchema: suggestionJsonSchema,
      },
    });

    if (!response.text) {
      throw new Error("Gemini response was empty.");
    }

    const suggestions = MealSuggestionResponseSchema.parse(JSON.parse(response.text));
    const { error: markSuccessError } = await supabaseAdmin
      .from("meal_suggestion_logs")
      .update({ success: true })
      .eq("id", claimedSlot.log_id)
      .eq("user_id", user.id);

    if (markSuccessError) {
      return errorResponse("提案結果の記録に失敗しました。", 500, "LOG_UPDATE_FAILED");
    }

    return Response.json({
      result: suggestions,
      usage: {
        used: claimedSlot.used,
        limit: claimedSlot.daily_limit,
      },
    });
  } catch (error) {
    await supabaseAdmin
      .from("meal_suggestion_logs")
      .delete()
      .eq("id", claimedSlot.log_id)
      .eq("user_id", user.id);

    console.error("[meal-suggestions]", error);
    return errorResponse("食事提案に失敗しました。", 502, "AI_SUGGESTION_FAILED");
  }
}
