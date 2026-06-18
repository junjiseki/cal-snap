"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type { MealList } from "@/components/meals/meal-list";

type MealListProps = ComponentProps<typeof MealList>;

/**
 * サーバー描画の shell を先に見せ、MealList チャンク読込成功後に編集 UI 付きへ差し替える。
 * チャンク失敗時は shell のまま（一覧は見える）。
 */
export function DashboardMealListClient({
  shell,
  ...props
}: MealListProps & { shell: ReactNode }) {
  const [MealListComponent, setMealListComponent] = useState<
    typeof MealList | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    import("@/components/meals/meal-list")
      .then((module) => {
        if (!cancelled) {
          setMealListComponent(() => module.MealList);
        }
      })
      .catch((error) => {
        console.error("[dashboard] meal-list chunk failed", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (MealListComponent) {
    return <MealListComponent {...props} />;
  }

  return shell;
}
