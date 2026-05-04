"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

type EditForm = {
  /** 日本時間の暦日 YYYY-MM-DD */
  eatenDate: string;
  /** 日本時間の時刻 HH:mm（input type="time"） */
  eatenTime: string;
  totalCalories: string;
  protein: string;
  fat: string;
  carbs: string;
  memo: string;
};

const TOKYO_TIME_ZONE = "Asia/Tokyo";

function toTokyoDateAndTime(iso: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

async function readMealsApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ?? "食事を登録できませんでした。";
  } catch {
    return "食事を登録できませんでした。";
  }
}

/** 日本時間の日付・時刻を UTC の ISO 文字列に変換（サーバー保存用） */
function tokyoDateAndTimeToIso(date: string, time: string) {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!dateMatch || !timeMatch) {
    throw new Error("日付または食べた時間の形式が正しくありません。");
  }

  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  const utcMs = Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh) - 9,
    Number(mm),
    0,
    0,
  );
  return new Date(utcMs).toISOString();
}

function createForm(meal: MealRow): EditForm {
  const { date, time } = toTokyoDateAndTime(meal.eaten_at);
  return {
    eatenDate: date,
    eatenTime: time,
    totalCalories: String(meal.total_calories),
    protein: String(Number(meal.protein)),
    fat: String(Number(meal.fat)),
    carbs: String(Number(meal.carbs)),
    memo: meal.memo ?? "",
  };
}

export function MealList({
  meals,
  mealsPage,
  mealsPageSize,
  totalMealsForDay,
  nextPageHref,
  prevPageHref,
  selectedDateYmd,
  todayDateYmd,
  goalCalories,
}: {
  meals: MealRow[];
  mealsPage: number;
  mealsPageSize: number;
  totalMealsForDay: number;
  nextPageHref: string | null;
  prevPageHref: string | null;
  /** カレンダーで選んでいる日（JST YYYY-MM-DD） */
  selectedDateYmd: string;
  todayDateYmd: string;
  /** 1日の目安（基準）カロリー。これと同じ kcal の食事を1件登録する */
  goalCalories: number;
}) {
  const router = useRouter();
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [busyMealId, setBusyMealId] = useState<string | null>(null);
  const [baselineSaving, setBaselineSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealMap = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals]);

  const rangeStart =
    meals.length === 0 ? 0 : (mealsPage - 1) * mealsPageSize + 1;
  const rangeEnd = (mealsPage - 1) * mealsPageSize + meals.length;
  const showPaginationFooter =
    totalMealsForDay > 0 && (totalMealsForDay > mealsPageSize || mealsPage > 1);

  async function startEdit(mealId: string) {
    const meal = mealMap.get(mealId);
    if (!meal) return;
    setError(null);
    setEditingMealId(mealId);
    setForm(createForm(meal));
  }

  async function saveEdit() {
    if (!editingMealId || !form) return;
    setBusyMealId(editingMealId);
    setError(null);
    try {
      const eatenAtIso = tokyoDateAndTimeToIso(form.eatenDate, form.eatenTime);
      const response = await fetch(`/api/meals/${editingMealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eaten_at: eatenAtIso,
          total_calories: Number(form.totalCalories),
          protein: Number(form.protein),
          fat: Number(form.fat),
          carbs: Number(form.carbs),
          memo: form.memo,
        }),
      });
      if (!response.ok) {
        throw new Error("食事を更新できませんでした。");
      }
      setEditingMealId(null);
      setForm(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新に失敗しました。");
    } finally {
      setBusyMealId(null);
    }
  }

  async function removeMeal(mealId: string) {
    const ok = window.confirm("この食事を削除しますか？");
    if (!ok) return;
    setBusyMealId(mealId);
    setError(null);
    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("食事を削除できませんでした。");
      }
      if (editingMealId === mealId) {
        setEditingMealId(null);
        setForm(null);
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "削除に失敗しました。");
    } finally {
      setBusyMealId(null);
    }
  }

  async function registerGoalCalorieMeal() {
    if (goalCalories <= 0 || baselineSaving) return;
    const kcal = Math.round(goalCalories);
    const ok = window.confirm(
      `選択した日（${selectedDateYmd}）に、1日の目安と同じ ${kcal} kcal の食事を1件追加します。よろしいですか？\n\n※ あとから内容を編集・削除できます。`,
    );
    if (!ok) return;

    setBaselineSaving(true);
    setError(null);
    try {
      const eatenAtIso = tokyoDateAndTimeToIso(selectedDateYmd, "12:00");
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eaten_at: eatenAtIso,
          total_calories: kcal,
          protein: 0,
          fat: 0,
          carbs: 0,
          ai_confidence: 1,
          memo: "基準カロリーによる記録",
          items: [
            {
              name: "基準カロリー分",
              estimated_amount: "—",
              calories: kcal,
              protein: 0,
              fat: 0,
              carbs: 0,
              confidence: 1,
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(await readMealsApiError(response));
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登録に失敗しました。");
    } finally {
      setBaselineSaving(false);
    }
  }

  return (
    <div className="divide-y divide-border">
      {error ? (
        <p className="border-b border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {meals.length === 0 ? (
        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            {selectedDateYmd === todayDateYmd
              ? "今日はまだ食事が登録されていません。"
              : "この日はまだ食事が登録されていません。"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`/meals/new?manual=1&date=${encodeURIComponent(selectedDateYmd)}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              手入力で記録する
            </Link>
            <button
              type="button"
              onClick={() => void registerGoalCalorieMeal()}
              disabled={goalCalories <= 0 || baselineSaving}
              title={
                goalCalories <= 0
                  ? "1日の目安カロリーが 0 のため使えません。プロフィールで目安を設定してください。"
                  : undefined
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              {baselineSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {baselineSaving
                ? "登録中…"
                : `基準（${goalCalories} kcal）と同じ摂取で記録`}
            </button>
          </div>
          {goalCalories > 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              「基準と同じ摂取で記録」は、その日の合計として目安カロリーの食事を1件だけ登録します。PFC（たんぱく質・脂質・炭水化物）は
              0 のまま入ります。あとから一覧から編集できます。
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              1日の目安カロリーが 0 のため、このショートカットは使えません。{" "}
              <Link href="/profile#calorie-goal" className="font-medium text-foreground underline">
                プロフィールで目安を設定
              </Link>
              してください。
            </p>
          )}
        </div>
      ) : null}
      {meals.map((meal) => {
        const isEditing = editingMealId === meal.id;
        const isBusy = busyMealId === meal.id;

        return (
          <article key={meal.id} className="space-y-4 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("ja-JP", {
                    timeZone: TOKYO_TIME_ZONE,
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(meal.eaten_at))}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{meal.total_calories} kcal</h3>
                {meal.memo ? <p className="mt-1 text-sm text-muted-foreground">{meal.memo}</p> : null}
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-muted-foreground">
                  P {Math.round(Number(meal.protein))}g / F {Math.round(Number(meal.fat))}g / C{" "}
                  {Math.round(Number(meal.carbs))}g
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => startEdit(meal.id)}
                    disabled={isBusy}
                    className="min-h-10 flex-1 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50 sm:h-8 sm:min-h-0 sm:flex-none sm:text-xs"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMeal(meal.id)}
                    disabled={isBusy}
                    aria-busy={isBusy}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-destructive/40 px-3 text-sm font-semibold text-destructive disabled:opacity-50 sm:h-8 sm:min-h-0 sm:flex-none sm:text-xs"
                  >
                    {isBusy ? <Loader2 className="size-4 animate-spin sm:size-3" /> : null}
                    {isBusy ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            </div>

            {isEditing && form ? (
              <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 md:grid-cols-3">
                <label className="text-sm">
                  食べた日（日本時間）
                  <input
                    type="date"
                    value={form.eatenDate}
                    onChange={(e) => setForm({ ...form, eatenDate: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  食べた時間（日本時間）
                  <input
                    type="time"
                    step={60}
                    value={form.eatenTime}
                    onChange={(e) => setForm({ ...form, eatenTime: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  kcal
                  <input
                    type="number"
                    min={0}
                    value={form.totalCalories}
                    onChange={(e) => setForm({ ...form, totalCalories: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  Protein
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.protein}
                    onChange={(e) => setForm({ ...form, protein: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  Fat
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.fat}
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  Carbs
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.carbs}
                    onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <label className="text-sm md:col-span-3">
                  メモ
                  <input
                    type="text"
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  />
                </label>
                <div className="flex gap-2 md:col-span-3">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={isBusy}
                    aria-busy={isBusy}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                    {isBusy ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMealId(null);
                      setForm(null);
                    }}
                    disabled={isBusy}
                    className="h-9 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 md:grid-cols-2">
              {(meal.meal_items ?? []).map((item) => (
                <div key={item.id} className="border border-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-muted-foreground">{item.estimated_amount}</p>
                    </div>
                    <p className="font-semibold">{item.calories} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        );
      })}
      {showPaginationFooter ? (
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
