import { NextResponse } from "next/server";
import { nextResponseAfterSession } from "@/lib/auth/post-login-redirect";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(next)}`, url.origin),
      );
    }
    return nextResponseAfterSession(supabase, next, url);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
