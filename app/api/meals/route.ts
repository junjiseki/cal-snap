import {
  MAX_MEALS_PER_DAY,
  MealRegistrationSchema,
  getDayRangeInJapan,
  toConfidence,
  toInteger,
} from "@/lib/meal-analysis";
import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import type { Json } from "@/lib/supabase/database.types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

function formatJstYmd(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const parsed = MealRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("登録内容を確認してください。", 400, "VALIDATION_FAILED");
  }

  const meal = parsed.data;
  const mealDay = getDayRangeInJapan(formatJstYmd(new Date(meal.eaten_at)));
  const { count: todayMealCount, error: countError } = await supabase
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("eaten_at", mealDay.start)
    .lte("eaten_at", mealDay.end);

  if (countError) {
    return errorResponse("食事登録数を確認できません。", 500, "MEAL_LIMIT_CHECK_FAILED");
  }

  if ((todayMealCount ?? 0) >= MAX_MEALS_PER_DAY) {
    return errorResponse(
      `1日に登録できる食事は${MAX_MEALS_PER_DAY}件までです。`,
      429,
      "DAILY_MEAL_LIMIT_EXCEEDED",
    );
  }

  const items = meal.items.map((item) => ({
    name: item.name,
    estimated_amount: item.estimated_amount,
    calories: toInteger(item.calories),
    protein: toInteger(item.protein),
    fat: toInteger(item.fat),
    carbs: toInteger(item.carbs),
    confidence: toConfidence(item.confidence),
  }));

  const { data: mealId, error: mealError } = await supabase.rpc(
    "create_meal_with_items",
    {
      p_user_id: user.id,
      p_eaten_at: new Date(meal.eaten_at).toISOString(),
      p_total_calories: toInteger(meal.total_calories),
      p_protein: toInteger(meal.protein),
      p_fat: toInteger(meal.fat),
      p_carbs: toInteger(meal.carbs),
      p_ai_confidence: toConfidence(meal.ai_confidence),
      p_memo: meal.memo || null,
      p_items: items as Json,
    },
  );

  if (mealError || !mealId) {
    if (mealError?.code === "P0001") {
      const message = mealError.message.includes("meal_items_limit_exceeded")
        ? "1つの食事に登録できる料理は14件までです。"
        : mealError.message.includes("daily_meal_limit_exceeded")
          ? `1日に登録できる食事は${MAX_MEALS_PER_DAY}件までです。`
          : "食事を登録できません。";
      return errorResponse(message, 429, "MEAL_LIMIT_EXCEEDED");
    }
    return errorResponse("食事を登録できません。", 500, "MEAL_CREATE_FAILED");
  }

  return Response.json({ mealId });
}
