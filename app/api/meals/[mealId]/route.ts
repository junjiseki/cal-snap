import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

type MealUpdateBody = {
  eaten_at?: string;
  total_calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  memo?: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NUTRITION_VALUE = 100_000;
const MAX_MEMO_LENGTH = 1000;

function toSafeNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mealId: string }> },
) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { mealId } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }
  if (!uuidPattern.test(mealId)) {
    return errorResponse("食事IDが不正です。", 400, "INVALID_MEAL_ID");
  }

  let body: MealUpdateBody;
  try {
    body = (await request.json()) as MealUpdateBody;
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const payload: Partial<MealUpdateBody> = {};

  if (typeof body.eaten_at === "string" && body.eaten_at.trim() !== "") {
    const parsed = new Date(body.eaten_at);
    if (Number.isNaN(parsed.getTime())) {
      return errorResponse("食べた日時が不正です。", 400, "INVALID_EATEN_AT");
    }
    payload.eaten_at = parsed.toISOString();
  }
  if (toSafeNumber(body.total_calories) !== null) {
    payload.total_calories = Math.min(
      MAX_NUTRITION_VALUE,
      Math.max(0, Math.round(body.total_calories as number)),
    );
  }
  if (toSafeNumber(body.protein) !== null) {
    payload.protein = Math.min(MAX_NUTRITION_VALUE, Math.max(0, Math.round(body.protein as number)));
  }
  if (toSafeNumber(body.fat) !== null) {
    payload.fat = Math.min(MAX_NUTRITION_VALUE, Math.max(0, Math.round(body.fat as number)));
  }
  if (toSafeNumber(body.carbs) !== null) {
    payload.carbs = Math.min(MAX_NUTRITION_VALUE, Math.max(0, Math.round(body.carbs as number)));
  }
  if (body.memo !== undefined) {
    const memo = body.memo?.trim() ? body.memo.trim() : null;
    if (memo && memo.length > MAX_MEMO_LENGTH) {
      return errorResponse("メモは1000文字以内で入力してください。", 400, "MEMO_TOO_LONG");
    }
    payload.memo = memo;
  }

  if (Object.keys(payload).length === 0) {
    return errorResponse("更新内容がありません。", 400, "EMPTY_UPDATE");
  }

  const { error } = await supabase
    .from("meals")
    .update(payload)
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (error) {
    return errorResponse("食事を更新できません。", 500, "MEAL_UPDATE_FAILED");
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ mealId: string }> },
) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { mealId } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }
  if (!uuidPattern.test(mealId)) {
    return errorResponse("食事IDが不正です。", 400, "INVALID_MEAL_ID");
  }

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (error) {
    return errorResponse("食事を削除できません。", 500, "MEAL_DELETE_FAILED");
  }

  return Response.json({ ok: true });
}
