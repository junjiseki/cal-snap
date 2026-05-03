import { SignupForm } from "@/components/meals/signup-form";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-[#d6fff2] px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <SignupForm next={safeInternalPath(params.next ?? null, "/meals/new")} />
      </div>
    </main>
  );
}
