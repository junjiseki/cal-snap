import { CALORIE_OVER_WARN_THRESHOLD_KCAL } from "@/lib/calorie-over";

export function CalorieOverLegend({ className }: { className?: string }) {
  const t = CALORIE_OVER_WARN_THRESHOLD_KCAL;
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        目標内
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400"
          aria-hidden
        />
        超過〜{t}kcal
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 shrink-0 rounded-full bg-red-500" aria-hidden />
        {t}kcal超の超過
      </span>
    </div>
  );
}
