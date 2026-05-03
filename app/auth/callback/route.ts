import { type NextRequest, NextResponse } from "next/server";
import { finalizeAuthSession } from "@/lib/auth/post-login-redirect";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

const CACHE_CONTROL_AUTH = "private, no-store, max-age=0";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeInternalPath(url.searchParams.get("next"), "/dashboard");

  const responseRef = {
    current: NextResponse.redirect(new URL(nextPath, url.origin)),
  };
  responseRef.current.headers.set("Cache-Control", CACHE_CONTROL_AUTH);

  const supabase = createSupabaseRouteHandlerClient(request, responseRef);

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(nextPath)}`, url.origin),
      );
    }

    const fin = await finalizeAuthSession(supabase, nextPath);
    if (!fin.ok) {
      responseRef.current = NextResponse.redirect(new URL(fin.redirectPath, url.origin));
      responseRef.current.headers.set("Cache-Control", CACHE_CONTROL_AUTH);
      await supabase.auth.signOut();
    }
    return responseRef.current;
  }

  return responseRef.current;
}
