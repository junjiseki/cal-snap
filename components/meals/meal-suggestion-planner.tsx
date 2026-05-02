"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  type MealSuggestionContext,
  type MealSuggestionResponse,
  type MealSuggestionSlot,
  mealSuggestionContextLabels,
  mealSuggestionSlotLabels,
} from "@/lib/meal-suggestions";

type Usage = {
  used: number;
  limit: number;
};

const contexts: MealSuggestionContext[] = ["eat_out", "cook", "convenience"];
const slots: MealSuggestionSlot[] = ["breakfast", "lunch", "dinner"];

export function MealSuggestionPlanner({ initialUsage }: { initialUsage: Usage }) {
  const [context, setContext] = useState<MealSuggestionContext>("eat_out");
  const [slot, setSlot] = useState<MealSuggestionSlot>("lunch");
  const [usage, setUsage] = useState(initialUsage);
  const [result, setResult] = useState<MealSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const remaining = Math.max(0, usage.limit - usage.used);

  async function suggest() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/meal-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, slot }),
      });
      const body = (await response.json()) as {
        result?: MealSuggestionResponse;
        usage?: Usage;
        error?: { message?: string };
      };

      if (!response.ok || !body.result || !body.usage) {
        throw new Error(body.error?.message || "食事提案に失敗しました。");
      }

      setResult(body.result);
      setUsage(body.usage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "食事提案に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
      <section className="border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold text-primary">有料プラン限定</p>
        <h2 className="mt-2 text-xl font-semibold">食事メニューを提案</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          外食・自炊・コンビニから選び、過去の食事傾向をもとにGeminiが候補を作ります。
        </p>

        <div className="mt-5 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">食事シーン</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {contexts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setContext(item)}
                  className={[
                    "min-h-11 rounded-md border px-2 text-sm font-semibold",
                    context === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  {mealSuggestionContextLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">食事タイミング</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {slots.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSlot(item)}
                  className={[
                    "min-h-11 rounded-md border px-2 text-sm font-semibold",
                    slot === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  {mealSuggestionSlotLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="rounded-md bg-muted/60 p-3 text-sm">
            <p className="font-semibold">今日の残り {remaining} 回</p>
            <p className="mt-1 text-muted-foreground">
              有料プランは1日{usage.limit}回まで提案できます。
            </p>
          </div>

          <button
            type="button"
            onClick={() => void suggest()}
            disabled={isLoading || remaining <= 0}
            aria-busy={isLoading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {isLoading ? "提案を作成中..." : "メニューを提案してもらう"}
          </button>

          {error ? (
            <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="text-lg font-semibold">提案結果</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            気に入った候補を選んで、次の食事の参考にしてください。
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:p-5">
          {!result ? (
            <div className="min-h-48 border border-dashed border-border bg-background p-5 text-sm leading-7 text-muted-foreground">
              条件を選んで提案ボタンを押すと、ここに候補が表示されます。過去の食事が少ない場合でも、一般的な目安から提案します。
            </div>
          ) : (
            <>
              <p className="rounded-md bg-primary/5 p-3 text-sm leading-7 text-primary">
                {result.summary}
              </p>
              {result.suggestions.map((suggestion) => (
                <article key={suggestion.title} className="border border-border bg-background p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {suggestion.reason}
                      </p>
                    </div>
                    <p className="shrink-0 rounded-md bg-muted px-3 py-1 text-sm font-semibold">
                      約{Math.round(suggestion.estimated_calories)} kcal
                    </p>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {suggestion.items.map((item) => (
                      <li key={item} className="rounded-md border border-border px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <p className="rounded-md bg-card p-2">P {Math.round(suggestion.protein)}g</p>
                    <p className="rounded-md bg-card p-2">F {Math.round(suggestion.fat)}g</p>
                    <p className="rounded-md bg-card p-2">C {Math.round(suggestion.carbs)}g</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {suggestion.adjustment_tip}
                  </p>
                </article>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
