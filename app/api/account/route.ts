import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function DELETE() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  const { error } = await supabase.rpc("soft_delete_my_account");

  if (error) {
    console.error("[account-delete]", error);
    return errorResponse("アカウントを削除できません。", 500, "ACCOUNT_DELETE_FAILED");
  }

  await supabase.auth.signOut();

  return Response.json({ ok: true });
}
