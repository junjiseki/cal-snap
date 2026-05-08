"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const MealPhotoAnalyzer = dynamic(
  () => import("@/components/meals/meal-photo-analyzer").then((mod) => mod.MealPhotoAnalyzer),
  {
    ssr: false,
    loading: () => <MealPhotoAnalyzerSkeleton />,
  },
);

export function LazyMealPhotoAnalyzer(props: ComponentProps<typeof MealPhotoAnalyzer>) {
  return <MealPhotoAnalyzer {...props} />;
}

function MealPhotoAnalyzerSkeleton() {
  return (
    <div
      className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start"
      aria-busy="true"
      aria-label="食事記録フォームを読み込み中"
    >
      <section className="space-y-4 border border-border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <div className="h-3 w-14 animate-pulse rounded bg-primary/20" />
          <div className="mt-2 h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-full max-w-64 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-11 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-28 animate-pulse rounded-md bg-muted/40" />
        <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-primary/20 bg-primary/5 p-4">
          <div className="size-12 animate-pulse rounded-full bg-primary/15" />
          <div className="mt-4 h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-12 animate-pulse rounded-md bg-primary/20" />
      </section>
      <section className="space-y-5 border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="h-3 w-14 animate-pulse rounded bg-primary/20" />
            <div className="mt-2 h-7 w-52 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-full max-w-sm animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-md bg-muted sm:w-32" />
        </div>
        <div className="h-36 animate-pulse rounded-md border border-dashed border-border bg-muted/20" />
      </section>
    </div>
  );
}
