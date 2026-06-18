import Link from "next/link";
import {
  dashboardDateHref,
  daysInJapanMonth,
  jstWeekdaySun0,
  pad2,
  shiftMonthJapan,
} from "@/lib/japan-calendar";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function buildCalendarCells(year: number, month: number) {
  const dim = daysInJapanMonth(year, month);
  const firstOfMonth = `${year}-${pad2(month)}-01`;
  const lead = jstWeekdaySun0(firstOfMonth);
  const cells: (
    | { kind: "blank"; leadIndex: number }
    | { kind: "day"; ymd: string }
  )[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push({ kind: "blank", leadIndex: i });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ kind: "day", ymd: `${year}-${pad2(month)}-${pad2(d)}` });
  }
  return cells;
}

/** クライアント JS 失敗時も日付選択できるサーバー描画カレンダー（Link ベース） */
export function DashboardMealCalendarShell({
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
  const mealDays = new Set(datesWithMeals);
  const [y, m] = selectedDate.split("-").map(Number);
  const cells = buildCalendarCells(y, m);

  const monthTitle = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
  }).format(new Date(`${y}-${pad2(m)}-01T12:00:00+09:00`));

  const prevMonthHref = dashboardDateHref(shiftMonthJapan(selectedDate, -1));
  const nextMonthHref = dashboardDateHref(shiftMonthJapan(selectedDate, 1));

  const navButtonClass =
    "inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground shadow-sm";
  const navDisabledClass = "cursor-not-allowed opacity-40";

  return (
    <div className="rounded-md border border-border bg-background p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {isPaid ? (
          <Link
            href={prevMonthHref}
            scroll={false}
            className={cn(navButtonClass, "hover:bg-muted")}
            aria-label="前の月"
          >
            ‹
          </Link>
        ) : (
          <span
            className={cn(navButtonClass, navDisabledClass)}
            aria-hidden
          >
            ‹
          </span>
        )}
        <p className="min-w-0 flex-1 text-center text-sm font-semibold">
          {monthTitle}
        </p>
        {isPaid ? (
          <Link
            href={nextMonthHref}
            scroll={false}
            className={cn(navButtonClass, "hover:bg-muted")}
            aria-label="次の月"
          >
            ›
          </Link>
        ) : (
          <span
            className={cn(navButtonClass, navDisabledClass)}
            aria-hidden
          >
            ›
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          if (cell.kind === "blank") {
            return (
              <div
                key={`blank-${y}-${pad2(m)}-${cell.leadIndex}`}
                className="aspect-square min-h-8 sm:min-h-9"
              />
            );
          }
          const { ymd } = cell;
          const isToday = ymd === todayDate;
          const isSelected = ymd === selectedDate;
          const hasMeals = mealDays.has(ymd);
          const isFuture = ymd > todayDate;
          const allowed = !isFuture && (isPaid || ymd === todayDate);

          const dayClass = cn(
            "relative flex aspect-square min-h-8 flex-col items-center justify-center rounded-md text-xs font-semibold sm:min-h-9 sm:text-sm",
            !allowed && "cursor-not-allowed opacity-35",
            allowed && !isSelected && "hover:bg-muted",
            isSelected && "bg-primary text-primary-foreground",
            isToday &&
              !isSelected &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background",
          );

          if (!allowed) {
            return (
              <span key={ymd} className={dayClass} aria-disabled="true">
                {Number(ymd.slice(8, 10))}
                {hasMeals ? (
                  <span
                    className="absolute bottom-1 size-1 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </span>
            );
          }

          return (
            <Link
              key={ymd}
              href={dashboardDateHref(ymd)}
              scroll={false}
              className={dayClass}
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
            </Link>
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
