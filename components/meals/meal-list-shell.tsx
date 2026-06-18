import Link from "next/link";

type MealItem = {
  id: string;
  name: string;
  estimated_amount: string;
  calories: number;
};

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
  memo: string | null;
  meal_items?: MealItem[];
};

const TOKYO_TIME_ZONE = "Asia/Tokyo";

function formatMealTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** クライアント JS 失敗時も食事内容を表示するサーバー描画の一覧 */
export function MealListShell({
  meals,
  mealsPage,
  mealsPageSize,
  totalMealsForDay,
  nextPageHref,
  prevPageHref,
  selectedDateYmd,
  todayDateYmd,
  goalCalories,
  isPaid,
}: {
  meals: MealRow[];
  mealsPage: number;
  mealsPageSize: number;
  totalMealsForDay: number;
  nextPageHref: string | null;
  prevPageHref: string | null;
  selectedDateYmd: string;
  todayDateYmd: string;
  goalCalories: number;
  isPaid: boolean;
}) {
  const rangeStart =
    meals.length === 0 ? 0 : (mealsPage - 1) * mealsPageSize + 1;
  const rangeEnd = (mealsPage - 1) * mealsPageSize + meals.length;
  const showPaginationFooter =
    totalMealsForDay > 0 && (totalMealsForDay > mealsPageSize || mealsPage > 1);

  return (
    <div className="divide-y divide-border">
      {meals.length === 0 ? (
        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-pretty text-sm text-muted-foreground">
            {selectedDateYmd === todayDateYmd
              ? "今日はまだ食事が登録されていません。"
              : "この日はまだ食事が登録されていません。"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/meals/new?date=${encodeURIComponent(selectedDateYmd)}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted sm:h-10 sm:w-auto"
            >
              写真で記録する
            </Link>
            {isPaid ? (
              <Link
                href={`/meals/new?manual=1&date=${encodeURIComponent(selectedDateYmd)}`}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted sm:h-10 sm:w-auto"
              >
                手入力で記録する
              </Link>
            ) : null}
          </div>
          {goalCalories <= 0 ? (
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              1日の目安カロリーが 0
              のため、基準にそったショートカットは使えません。{" "}
              <Link
                href="/profile#calorie-goal"
                className="font-medium text-foreground underline"
              >
                プロフィールで目安を設定
              </Link>
              してください。
            </p>
          ) : !isPaid ? (
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              「基準と同じ摂取で記録」は有料プランの機能です。無料プランでは写真から食事を登録してください。
            </p>
          ) : null}
        </div>
      ) : null}
      {meals.map((meal) => (
        <article key={meal.id} className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {formatMealTime(meal.eaten_at)}
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                {meal.total_calories} kcal
              </h3>
              {meal.memo ? (
                <p className="mt-1 text-sm text-muted-foreground">{meal.memo}</p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              P {Math.round(Number(meal.protein))}g / F{" "}
              {Math.round(Number(meal.fat))}g / C{" "}
              {Math.round(Number(meal.carbs))}g
            </p>
          </div>
          {(meal.meal_items ?? []).length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {(meal.meal_items ?? []).map((item) => (
                <div key={item.id} className="border border-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.estimated_amount}
                      </p>
                    </div>
                    <p className="font-semibold">{item.calories} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
      {showPaginationFooter ? (
        <div className="flex flex-col gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pb-5">
          <p className="text-xs text-muted-foreground">
            {meals.length === 0
              ? `全 ${totalMealsForDay} 件`
              : `${rangeStart}–${rangeEnd} 件を表示 / 全 ${totalMealsForDay} 件`}
            {totalMealsForDay > mealsPageSize
              ? `（1ページあたり最大 ${mealsPageSize} 件）`
              : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {prevPageHref ? (
              <Link
                href={prevPageHref}
                scroll={false}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
              >
                前へ
              </Link>
            ) : null}
            {nextPageHref ? (
              <Link
                href={nextPageHref}
                scroll={false}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                さらに表示
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
