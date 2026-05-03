import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AuthSessionFinalizeResult =
  | { ok: true }
  | { ok: false; redirectPath: string; clearSession: true };

/** セッション確立後の profiles チェック。失敗時は signOut 前に redirect 先だけ返す（呼び出し側で response を差し替えてから signOut）。 */
export async function finalizeAuthSession(
  supabase: SupabaseClient<Database>,
  nextPath: string,
): Promise<AuthSessionFinalizeResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[finalizeAuthSession] profile deleted_at fetch failed", profileError);
    return {
      ok: false,
      redirectPath: `/login?error=profile_fetch&next=${encodeURIComponent(nextPath)}`,
      clearSession: true,
    };
  }

  if (profile?.deleted_at) {
    return {
      ok: false,
      redirectPath: `/login?inactive=1&next=${encodeURIComponent(nextPath)}`,
      clearSession: true,
    };
  }

  return { ok: true };
}
