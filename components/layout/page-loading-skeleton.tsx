import { Skeleton } from "@/components/ui/skeleton";

/**
 * ルート遷移時（app/loading.tsx）用。ヘッダー・フッター直下のメイン領域に合わせた汎用スケルトン。
 */
export function PageLoadingSkeleton() {
  return (
    <main
      className="flex flex-1 flex-col bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">ページを読み込んでいます</span>
      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 sm:py-6">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="mt-3 h-9 w-2/3 max-w-md rounded sm:h-10" />
          <Skeleton className="mt-2 h-4 w-40 rounded" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-lg border border-border bg-card/50" />
          <Skeleton className="h-28 rounded-lg border border-border bg-card/50" />
          <Skeleton className="h-28 rounded-lg border border-border bg-card/50 sm:col-span-2 lg:col-span-1" />
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 flex-1 max-w-[8rem] rounded-md" />
            <Skeleton className="h-10 flex-1 max-w-[8rem] rounded-md" />
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-48 rounded" />
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
