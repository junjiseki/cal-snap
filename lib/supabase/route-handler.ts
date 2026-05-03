import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

type ResponseRef = { current: NextResponse };

/**
 * Route Handler 用: `exchangeCodeForSession` 等で Set-Cookie した内容を、
 * 最終的に return する `NextResponse` に確実に載せる（別インスタンスの redirect に載せない）。
 */
export function createSupabaseRouteHandlerClient(request: NextRequest, responseRef: ResponseRef) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          responseRef.current.cookies.set(name, value, options);
        });
      },
    },
  });
}
