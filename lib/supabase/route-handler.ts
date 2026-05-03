import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

type ResponseRef = { current: NextResponse };

/**
 * Route Handler 用: `exchangeCodeForSession` 等で Set-Cookie した内容を、
 * 最終的に return する `NextResponse` に載せつつ、同一ハンドラ内の後続 `getUser()` が
 * リクエスト由来の Cookie ではなく更新後の値を `getAll()` で読めるようにする。
 */
export function createSupabaseRouteHandlerClient(request: NextRequest, responseRef: ResponseRef) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  const jar = new Map<string, { name: string; value: string }>();
  for (const c of request.cookies.getAll()) {
    jar.set(c.name, { name: c.name, value: c.value });
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return Array.from(jar.values());
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          jar.set(name, { name, value });
          responseRef.current.cookies.set(name, value, options);
        }
      },
    },
  });
}
