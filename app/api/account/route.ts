import {
  forbiddenOriginResponse,
  isAllowedOrigin,
} from "@/lib/security/request";
import { cancelStripeSubscriptionsForUser } from "@/lib/stripe/cancel-subscriptions-for-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthSessionUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function DELETE(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { supabase, user } = await getAuthSessionUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  const userId = user.id;

  const stripeCancel = await cancelStripeSubscriptionsForUser(userId);
  if (!stripeCancel.ok) {
    return errorResponse(stripeCancel.message, 502, stripeCancel.code);
  }

  let supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch {
    return errorResponse(
      "アカウントを削除する設定が不足しています。",
      500,
      "SUPABASE_ADMIN_NOT_CONFIGURED",
    );
  }

  const { error: deleteError } =
    await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("[account-delete]", deleteError);
    return errorResponse(
      "アカウントを削除できません。",
      500,
      "ACCOUNT_DELETE_FAILED",
    );
  }

  await supabase.auth.signOut();

  return Response.json({ ok: true });
}
