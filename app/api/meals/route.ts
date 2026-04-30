import { MealRegistrationSchema, toConfidence, toInteger } from "@/lib/meal-analysis";
import type { Json } from "@/lib/supabase/database.types";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
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
  const items = meal.items.map((item) => ({
    name: item.name,
    estimated_amount: item.estimated_amount,
    calories: toInteger(item.calories),
    protein: Number(item.protein.toFixed(1)),
    fat: Number(item.fat.toFixed(1)),
    carbs: Number(item.carbs.toFixed(1)),
    confidence: toConfidence(item.confidence),
  }));

  const { data: mealId, error: mealError } = await supabase.rpc(
    "create_meal_with_items",
    {
      p_user_id: user.id,
      p_eaten_at: new Date(meal.eaten_at).toISOString(),
      p_total_calories: toInteger(meal.total_calories),
      p_protein: Number(meal.protein.toFixed(1)),
      p_fat: Number(meal.fat.toFixed(1)),
      p_carbs: Number(meal.carbs.toFixed(1)),
      p_ai_confidence: toConfidence(meal.ai_confidence),
      p_memo: meal.memo || null,
      p_items: items as Json,
    },
  );

  if (mealError || !mealId) {
    return errorResponse("食事を登録できません。", 500, "MEAL_CREATE_FAILED");
  }

  return Response.json({ mealId });
}
