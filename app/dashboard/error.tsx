"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] render failed", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5">
      <div className="border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">
          ダッシュボードを表示できません
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          通信状況や一時的な不具合の可能性があります。再読み込みするか、少し時間をおいてお試しください。
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            再試行
          </button>
          <Link
            href="/meals/new"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
          >
            食事記録へ
          </Link>
        </div>
      </div>
    </main>
  );
}
