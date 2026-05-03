"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  dashboardDateHref,
  daysInJapanMonth,
  jstWeekdaySun0,
  pad2,
  shiftMonthJapan,
} from "@/lib/japan-calendar";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function DashboardMealCalendar({
  selectedDate,
  todayDate,
  isPaid,
  datesWithMeals,
}: {
  selectedDate: string;
  todayDate: string;
  isPaid: boolean;
  datesWithMeals: string[];
}) {
  const router = useRouter();
  const mealDays = new Set(datesWithMeals);

  const [y, m] = selectedDate.split("-").map(Number);
  const dim = daysInJapanMonth(y, m);
  const firstOfMonth = `${y}-${pad2(m)}-01`;
  const lead = jstWeekdaySun0(firstOfMonth);

  const cells: ({ kind: "blank" } | { kind: "day"; ymd: string })[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push({ kind: "blank" });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ kind: "day", ymd: `${y}-${pad2(m)}-${pad2(d)}` });
  }

  const monthTitle = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
  }).format(new Date(`${y}-${pad2(m)}-01T12:00:00+09:00`));

  function goMonth(delta: number) {
    const next = shiftMonthJapan(selectedDate, delta);
    router.push(dashboardDateHref(next), { scroll: false });
  }

  function selectDay(ymd: string) {
    router.push(dashboardDateHref(ymd), { scroll: false });
  }

  return (
    <div className="rounded-md border border-border bg-background p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={!isPaid}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground shadow-sm",
            isPaid ? "hover:bg-muted" : "cursor-not-allowed opacity-40",
          )}
          aria-label="前の月"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold">{monthTitle}</p>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={!isPaid}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground shadow-sm",
            isPaid ? "hover:bg-muted" : "cursor-not-allowed opacity-40",
          )}
          aria-label="次の月"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (cell.kind === "blank") {
            return <div key={`b-${index}`} className="aspect-square min-h-8 sm:min-h-9" />;
          }
          const { ymd } = cell;
          const isToday = ymd === todayDate;
          const isSelected = ymd === selectedDate;
          const hasMeals = mealDays.has(ymd);
          const isFuture = ymd > todayDate;
          const allowed = !isFuture && (isPaid || ymd === todayDate);

          return (
            <button
              key={ymd}
              type="button"
              disabled={!allowed}
              onClick={() => allowed && selectDay(ymd)}
              className={cn(
                "relative flex aspect-square min-h-8 flex-col items-center justify-center rounded-md text-xs font-semibold transition-colors sm:min-h-9 sm:text-sm",
                !allowed && "cursor-not-allowed opacity-35",
                allowed && !isSelected && "hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground",
                isToday && !isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              {Number(ymd.slice(8, 10))}
              {hasMeals ? (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary",
                  )}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {!isPaid ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          無料プランは本日のみ選択できます（カレンダーは今月の表示用です）。
        </p>
      ) : null}
    </div>
  );
}
