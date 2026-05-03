import { NextResponse } from "next/server";

/** 認証 Route Handler のリダイレクトは中間キャッシュさせない */
export const CACHE_CONTROL_AUTH_ROUTE = "private, no-store, max-age=0";

export function authRouteRedirect(target: URL): NextResponse {
  const res = NextResponse.redirect(target);
  res.headers.set("Cache-Control", CACHE_CONTROL_AUTH_ROUTE);
  return res;
}
