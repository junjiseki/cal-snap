"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type { DashboardMealCalendar } from "@/components/meals/dashboard-meal-calendar";

type CalendarProps = ComponentProps<typeof DashboardMealCalendar>;

/** サーバー shell を先に表示し、インタラクティブ版の読込成功後に差し替える */
export function DashboardMealCalendarClient({
  shell,
  ...props
}: CalendarProps & { shell: ReactNode }) {
  const [CalendarComponent, setCalendarComponent] = useState<
    typeof DashboardMealCalendar | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    import("@/components/meals/dashboard-meal-calendar")
      .then((module) => {
        if (!cancelled) {
          setCalendarComponent(() => module.DashboardMealCalendar);
        }
      })
      .catch((error) => {
        console.error("[dashboard] meal-calendar chunk failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (CalendarComponent) {
    return <CalendarComponent {...props} />;
  }

  return shell;
}
