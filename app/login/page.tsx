import { redirect } from "next/navigation";
import { LoginForm } from "@/components/meals/login-form";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    deleted?: string;
    inactive?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const { user } = await getAuthenticatedUserCached();
  if (user) {
    redirect("/meals/new");
  }

  const profileFetchFailed = params.error === "profile_fetch";

  return (
    <main className="flex flex-1 items-center justify-center bg-[#fff3c7] px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <LoginForm
          next={safeInternalPath(params.next ?? null, "/dashboard")}
          accountDeleted={params.deleted === "1"}
          accountInactive={params.inactive === "1"}
          authConfirmFailed={params.error === "auth_confirm"}
          profileFetchFailed={profileFetchFailed}
        />
      </div>
    </main>
  );
}
