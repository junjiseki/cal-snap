import { type NextRequest } from "next/server";
import { authRouteRedirect } from "@/lib/auth/auth-route-response";
import { finalizeAuthSession } from "@/lib/auth/post-login-redirect";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeInternalPath(url.searchParams.get("next"), "/dashboard");

  const responseRef = {
    current: authRouteRedirect(new URL(nextPath, url.origin)),
  };

  const supabase = createSupabaseRouteHandlerClient(request, responseRef);

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return authRouteRedirect(
        new URL(`/login?next=${encodeURIComponent(nextPath)}`, url.origin),
      );
    }

    const fin = await finalizeAuthSession(supabase, nextPath);
    if (!fin.ok) {
      responseRef.current = authRouteRedirect(new URL(fin.redirectPath, url.origin));
      await supabase.auth.signOut();
    }
    return responseRef.current;
  }

  return responseRef.current;
}
