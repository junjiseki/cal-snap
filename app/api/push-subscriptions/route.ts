import { PushSubscriptionPayloadSchema } from "@/lib/push-subscriptions";
import {
  forbiddenOriginResponse,
  isAllowedOrigin,
} from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  const parsed = PushSubscriptionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "通知設定を確認してください。",
      400,
      "VALIDATION_FAILED",
    );
  }

  const subscription = parsed.data;
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: request.headers.get("user-agent"),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push-subscriptions] save failed", error);
    return errorResponse(
      "通知設定を保存できません。",
      500,
      "PUSH_SUBSCRIPTION_SAVE_FAILED",
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return errorResponse("JSONを読み取れません。", 400, "BAD_JSON");
  }

  if (!body.endpoint) {
    return errorResponse("endpoint が必要です。", 400, "VALIDATION_FAILED");
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);

  if (error) {
    console.error("[push-subscriptions] delete failed", error);
    return errorResponse(
      "通知設定を解除できません。",
      500,
      "PUSH_SUBSCRIPTION_DELETE_FAILED",
    );
  }

  return Response.json({ ok: true });
}
