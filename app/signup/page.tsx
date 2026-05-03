import { SignupForm } from "@/components/meals/signup-form";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-10 sm:px-5">
      <SignupForm next={safeInternalPath(params.next ?? null, "/dashboard")} />
    </main>
  );
}
