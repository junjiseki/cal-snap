import { beforeEach, describe, expect, it, vi } from "vitest";

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: ReturnType<typeof vi.fn>;
};

function createCookieStore(): CookieStore {
  return {
    getAll: () => [{ name: "sb-test-auth-token", value: "token" }],
    set: vi.fn(),
  };
}

function createSupabaseMock({
  authUserId = "user-1",
  profileData = null,
  profileError = null,
}: {
  authUserId?: string | null;
  profileData?: { deleted_at?: string | null; plan?: "free" | "paid"; daily_calorie_goal?: number } | null;
  profileError?: { message: string } | null;
}) {
  const signOut = vi.fn().mockResolvedValue({});
  const maybeSingle = vi.fn().mockResolvedValue({ data: profileData, error: profileError });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: authUserId ? { id: authUserId, user_metadata: {} } : null },
          error: null,
        }),
        signOut,
      },
      from,
    },
    signOut,
    from,
    select,
    eq,
    maybeSingle,
  };
}

async function importServerModuleWithMocks({
  cookieStore,
  supabaseClient,
}: {
  cookieStore: CookieStore;
  supabaseClient: ReturnType<typeof createSupabaseMock>["client"];
}) {
  vi.resetModules();
  vi.doMock("react", () => ({
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  }));
  vi.doMock("next/headers", () => ({
    cookies: vi.fn().mockResolvedValue(cookieStore),
  }));
  vi.doMock("@supabase/ssr", () => ({
    createServerClient: vi.fn().mockReturnValue(supabaseClient),
  }));

  return import("@/lib/supabase/server");
}

describe("supabase server auth guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("getAuthenticatedUser signs out only when deleted_at is true", async () => {
    const cookieStore = createCookieStore();
    const supabase = createSupabaseMock({
      profileData: { deleted_at: "2026-05-01T00:00:00.000Z" },
    });
    const { getAuthenticatedUser } = await importServerModuleWithMocks({
      cookieStore,
      supabaseClient: supabase.client,
    });

    const result = await getAuthenticatedUser();

    expect(result.user).toBeNull();
    expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
    expect(supabase.signOut).toHaveBeenCalledTimes(1);
  });

  it("getAuthenticatedUser keeps session on profile query error", async () => {
    const cookieStore = createCookieStore();
    const supabase = createSupabaseMock({
      authUserId: "user-error-case",
      profileError: { message: "temporary failure" },
    });
    const { getAuthenticatedUser } = await importServerModuleWithMocks({
      cookieStore,
      supabaseClient: supabase.client,
    });

    const result = await getAuthenticatedUser();

    expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
    expect(result.user?.id).toBe("user-error-case");
    expect(supabase.signOut).not.toHaveBeenCalled();
  });

  it("getAuthenticatedUserWithProfile keeps session on profile query error", async () => {
    const cookieStore = createCookieStore();
    const supabase = createSupabaseMock({
      authUserId: "user-with-profile-error",
      profileError: { message: "read timeout" },
    });
    const { getAuthenticatedUserWithProfile } = await importServerModuleWithMocks({
      cookieStore,
      supabaseClient: supabase.client,
    });

    const result = await getAuthenticatedUserWithProfile();

    expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
    expect(result.user?.id).toBe("user-with-profile-error");
    expect(result.profile).toBeNull();
    expect(supabase.signOut).not.toHaveBeenCalled();
  });
});
