import {
  MEAL_REMINDER_TYPES,
  MealReminderSettingsPayloadSchema,
} from "@/lib/meal-reminders";
import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

async function requirePaidProfile(supabase: Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"], userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, response: errorResponse("プランを確認できません。", 500, "PROFILE_FETCH_FAILED") };
  }

  if (profile?.plan !== "paid") {
    return { ok: false as const, response: errorResponse("食事時間の登録は有料プランで利用できます。", 403, "PAID_PLAN_REQUIRED") };
  }

  return { ok: true as const };
}

export async function PATCH(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  const paid = await requirePaidProfile(supabase, user.id);
  if (!paid.ok) return paid.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const parsed = MealReminderSettingsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("食事時間の設定内容を確認してください。", 400, "VALIDATION_FAILED");
  }

  const mealTypes = new Set(parsed.data.settings.map((setting) => setting.meal_type));
  if (mealTypes.size !== MEAL_REMINDER_TYPES.length) {
    return errorResponse("食事時間の種類が重複しています。", 400, "DUPLICATE_MEAL_TYPE");
  }

  const rows = parsed.data.settings.map((setting) => ({
    user_id: user.id,
    meal_type: setting.meal_type,
    notify_time: setting.notify_time,
    enabled: setting.enabled,
  }));

  const { error } = await supabase
    .from("meal_reminder_settings")
    .upsert(rows, { onConflict: "user_id,meal_type" });

  if (error) {
    return errorResponse("食事時間を保存できません。", 500, "MEAL_REMINDER_SAVE_FAILED");
  }

  return Response.json({ ok: true });
}
