import { type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { authRouteRedirect } from "@/lib/auth/auth-route-response";
import { finalizeAuthSession } from "@/lib/auth/post-login-redirect";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeInternalPath(url.searchParams.get("next"), "/meals/new");

  const responseRef = {
    current: authRouteRedirect(new URL(next, url.origin)),
  };

  const supabase = createSupabaseRouteHandlerClient(request, responseRef);

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const fin = await finalizeAuthSession(supabase, next);
      if (!fin.ok) {
        responseRef.current = authRouteRedirect(new URL(fin.redirectPath, url.origin));
        await supabase.auth.signOut();
      }
      return responseRef.current;
    }
    return authRouteRedirect(new URL("/login?error=auth_confirm", url.origin));
  }

  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error) {
      const fin = await finalizeAuthSession(supabase, next);
      if (!fin.ok) {
        responseRef.current = authRouteRedirect(new URL(fin.redirectPath, url.origin));
        await supabase.auth.signOut();
      }
      return responseRef.current;
    }
  }

  return authRouteRedirect(new URL("/login?error=auth_confirm", url.origin));
}
