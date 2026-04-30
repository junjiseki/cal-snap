import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  let body: { daily_calorie_goal?: number };
  try {
    body = (await request.json()) as { daily_calorie_goal?: number };
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const value = body.daily_calorie_goal;
  if (!Number.isInteger(value) || (value as number) < 0) {
    return errorResponse(
      "daily_calorie_goal は0以上の整数で指定してください。",
      400,
      "VALIDATION_FAILED",
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ daily_calorie_goal: value as number })
    .eq("id", user.id);

  if (error) {
    return errorResponse("摂取カロリーを更新できません。", 500, "PROFILE_UPDATE_FAILED");
  }

  return Response.json({ ok: true });
}
