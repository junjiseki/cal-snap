import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { isStaleRefreshTokenError } from "@/lib/supabase/stale-session";

export type SupabaseCookieStore = Awaited<ReturnType<typeof cookies>>;

function hasSupabaseAuthCookie(cookieStore: SupabaseCookieStore) {
  return cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

/**
 * @param cookieStore - 省略時は内部で `cookies()` を1回だけ呼ぶ。既に取得済みの store を渡すと二重読みを避けられる。
 */
export async function createClient(cookieStore?: SupabaseCookieStore) {
  const store = cookieStore ?? (await cookies());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            store.set(name, value, options);
          });
        } catch {
          // TODO: Rely on proxy.ts (or route handlers) for session refresh before production.
        }
      },
    },
  });
}

/**
 * JWT のユーザーのみ返す。`profiles.deleted_at` による強制 signOut はしない。
 * 論理削除のみ残っているレガシーアカウントの `DELETE /api/account` などで使う。
 */
export async function getAuthSessionUser() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  if (!hasSupabaseAuthCookie(cookieStore)) {
    return { supabase, user: null };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && isStaleRefreshTokenError(error)) {
    await supabase.auth.signOut();
    return { supabase, user: null };
  }

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function getAuthenticatedUser() {
  const { supabase, user } = await getAuthSessionUser();

  if (!user) {
    return { supabase, user: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getAuthenticatedUser] profile deleted_at fetch failed", error);
    return { supabase, user };
  }

  if (profile?.deleted_at) {
    await supabase.auth.signOut();
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function getAuthenticatedUserWithProfile() {
  const { supabase, user } = await getAuthSessionUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("deleted_at,plan,daily_calorie_goal")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getAuthenticatedUserWithProfile] profile fetch failed", error);
    return { supabase, user, profile: null };
  }

  if (profile?.deleted_at) {
    await supabase.auth.signOut();
    return { supabase, user: null, profile: null };
  }

  return { supabase, user, profile };
}

/**
 * Server Components / Layout 内で同一リクエスト中の認証取得を共有する。
 * Route Handler では副作用やリクエスト境界を明確にするため、通常の getAuthenticatedUser を使う。
 */
export const getAuthenticatedUserCached = cache(getAuthenticatedUser);
export const getAuthenticatedUserWithProfileCached = cache(getAuthenticatedUserWithProfile);
