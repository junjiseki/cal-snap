import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** セッション確立後、論理削除済みならサインアウトしてログインへ。 */
export async function nextResponseAfterSession(
  supabase: SupabaseClient<Database>,
  nextPath: string,
  requestUrl: URL,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("deleted_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.deleted_at) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(`/login?inactive=1&next=${encodeURIComponent(nextPath)}`, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
