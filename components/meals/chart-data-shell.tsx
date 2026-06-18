import { lastNJstDaysAsc, toJapanYmd } from "@/lib/japan-calendar";

type ChartMeal = {
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

/** recharts なし。サーバー描画の14日サマリー（モバイル JS 失敗時も表示） */
export function ChartDataShell({
  meals,
  goalCalories,
  chartEndDate,
}: {
  meals: ChartMeal[];
  goalCalories: number;
  chartEndDate: string;
}) {
  const days = lastNJstDaysAsc(14, chartEndDate);
  const totals = new Map<
    string,
    { calories: number; protein: number; fat: number; carbs: number }
  >();

  for (const day of days) {
    totals.set(day, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }

  for (const meal of meals) {
    const day = toJapanYmd(meal.eaten_at);
    const row = totals.get(day);
    if (!row) continue;
    row.calories += Number(meal.total_calories) || 0;
    row.protein += Number(meal.protein) || 0;
    row.fat += Number(meal.fat) || 0;
    row.carbs += Number(meal.carbs) || 0;
  }

  const maxCalories = Math.max(
    goalCalories,
    ...days.map((d) => totals.get(d)?.calories ?? 0),
    1,
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-2" aria-label="直近14日の摂取カロリー">
        {days.map((day) => {
          const row = totals.get(day) ?? {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
          };
          const width = Math.round((row.calories / maxCalories) * 100);
          const label = new Intl.DateTimeFormat("ja-JP", {
            timeZone: "Asia/Tokyo",
            month: "numeric",
            day: "numeric",
            weekday: "short",
          }).format(new Date(`${day}T12:00:00+09:00`));

          return (
            <li key={day} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="tabular-nums font-medium">{row.calories} kcal</span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        目安 {goalCalories} kcal / 棒グラフは日ごとの合計カロリーです。
      </p>
    </div>
  );
}
