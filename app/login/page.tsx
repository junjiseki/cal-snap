import { redirect } from "next/navigation";
import { LoginForm } from "@/components/meals/login-form";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect("/meals/new");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-10 sm:px-5">
      <LoginForm next={params.next || "/dashboard"} />
    </main>
  );
}
