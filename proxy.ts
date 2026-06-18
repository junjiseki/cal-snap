import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { PERMISSIONS_POLICY } from "@/lib/http-security";
import { isStaleRefreshTokenError } from "@/lib/supabase/stale-session";

/** next.config から移したものと同一（HTML をエッジ長期キャッシュしない） */
const DOCUMENT_CACHE_CONTROL =
  "private, no-cache, must-revalidate, max-age=0, s-maxage=0";

const AUTH_CONTEXT_HEADER = "x-kalosna-auth-context";

/** 旧 SW 解除済みマーカー（Clear-Site-Data は cookies には触れない） */
const SW_CLEAR_COOKIE = "kalosna-sw-cleared-v16";

function isMobileUserAgent(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  return /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
}

/** HTML ナビゲーション向け（静的ファイル・API は除外） */
function isHtmlNavigation(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/") || p.startsWith("/_next/")) return false;
  const last = p.split("/").pop() ?? "";
  if (last && /\.[\w.-]+$/.test(last)) return false;
  return true;
}

/**
 * モバイルで旧 SW が `/_next/static/` を横取りしている端末向け。
 * JS より前にブラウザへ SW / Cache Storage 解除を指示する（200 でもクライアントが落ちる原因）。
 */
function applyStaleServiceWorkerReset(res: NextResponse, request: NextRequest) {
  if (!isMobileUserAgent(request)) return;
  if (!isHtmlNavigation(request)) return;
  if (request.cookies.get(SW_CLEAR_COOKIE)?.value === "1") return;

  res.headers.set("Clear-Site-Data", '"cache", "storage"');
  res.cookies.set(SW_CLEAR_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
    );
}

function shouldNoStore(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/billing" ||
    pathname === "/dashboard" ||
    pathname === "/meals/new" ||
    pathname === "/meal-reminders" ||
    pathname === "/profile" ||
    pathname === "/settings" ||
    pathname === "/suggestions"
  );
}

function shouldRefreshAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return (
    pathname === "/login" ||
    pathname === "/dashboard" ||
    pathname === "/meals/new" ||
    pathname === "/meal-reminders" ||
    pathname === "/profile" ||
    pathname === "/settings" ||
    pathname === "/suggestions" ||
    pathname === "/billing"
  );
}

/** next.config の `headers` ソースに相当（ページ HTML のみ弱キャッシュ） */
function shouldApplyDocumentCachePolicy(request: NextRequest): boolean {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/") || p.startsWith("/_next/")) return false;
  if (
    p === "/favicon.ico" ||
    p === "/manifest.json" ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    p === "/sw.js" ||
    p === "/sw-passive.js" ||
    p.startsWith("/sw-migrate.js")
  ) {
    return false;
  }
  const last = p.split("/").pop() ?? "";
  if (last && /\.[\w.-]+$/.test(last)) return false;
  return true;
}

function applySecurityHeaders(res: NextResponse, request: NextRequest) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  if (request.nextUrl.protocol === "https:") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
}

function applyCacheHeaders(res: NextResponse, request: NextRequest) {
  if (shouldNoStore(request)) {
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return;
  }
  if (shouldApplyDocumentCachePolicy(request)) {
    res.headers.set("Cache-Control", DOCUMENT_CACHE_CONTROL);
  }
}

export async function proxy(request: NextRequest) {
  const finish = (res: NextResponse) => {
    applySecurityHeaders(res, request);
    applyCacheHeaders(res, request);
    applyStaleServiceWorkerReset(res, request);
    return res;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const shouldUseAuthContext = shouldRefreshAuth(request);
  const requestHeaders = new Headers(request.headers);
  if (shouldUseAuthContext) {
    requestHeaders.set(AUTH_CONTEXT_HEADER, "1");
  } else {
    requestHeaders.delete(AUTH_CONTEXT_HEADER);
  }

  if (!url || !anonKey) {
    return finish(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (shouldUseAuthContext && hasSupabaseAuthCookie(request)) {
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.getUser();

    if (error && isStaleRefreshTokenError(error)) {
      await supabase.auth.signOut();
    }
  }

  return finish(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|robots\\.txt|sitemap\\.xml|sw\\.js|sw-passive\\.js|sw-migrate\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
