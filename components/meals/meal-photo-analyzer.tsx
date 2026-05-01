"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { MealAnalysis } from "@/lib/meal-analysis";

type ApiError = {
  error?: {
    message?: string;
    code?: string;
  };
};

const emptyAnalysis: MealAnalysis = {
  total_calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  ai_confidence: 0,
  memo: "",
  items: [],
};

function todayInputValue() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [date, time] = formatter.format(new Date()).split(" ");
  return `${date}T${time}`;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readError(response: Response) {
  try {
    const data = (await response.json()) as ApiError;
    return data.error?.message || "処理に失敗しました。";
  } catch {
    return "処理に失敗しました。";
  }
}

function StepDot({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={[
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          done
            ? "border-emerald-600 bg-emerald-600 text-white"
            : active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="size-4" /> : null}
      </span>
      <span
        className={[
          "truncate text-xs font-semibold sm:text-sm",
          active || done ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

export function MealPhotoAnalyzer() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [eatenAt, setEatenAt] = useState(todayInputValue());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(
    null,
  );

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);
  const limitBlocked = (usage?.remaining ?? 1) <= 0;
  const activeStep = analysis ? 3 : file ? 2 : 1;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch("/api/meals/analyze", { method: "GET" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          usage: { used: number; limit: number; remaining: number };
        };
        if (!mounted) return;
        setUsage(data.usage);
      } catch {
        // 初期表示では解析回数が取れなくても操作を妨げない。
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    setNotice(null);
    setAnalysis(null);
    setFile(selected);
  }

  function clearSelectedImage() {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setNotice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function analyze() {
    if (usage && usage.remaining <= 0) {
      setError(`本日の解析上限に達しました。1日${usage.limit}回までです。`);
      return;
    }

    if (!file) {
      setError("画像を選択してください。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/meals/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = (await response.json()) as {
        analysis: MealAnalysis;
        usage: { used: number; limit: number };
      };
      setAnalysis(data.analysis);
      setUsage({
        used: data.usage.used,
        limit: data.usage.limit,
        remaining: Math.max(0, data.usage.limit - data.usage.used),
      });
      setNotice(`解析完了。残り ${Math.max(0, data.usage.limit - data.usage.used)} 回`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function save() {
    const payload = analysis ?? emptyAnalysis;

    if (!analysis) {
      setError("AI推定結果を確認してから登録してください。");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          eaten_at: new Date(eatenAt).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "食事を登録できません。");
    } finally {
      setIsSaving(false);
    }
  }

  function updateMeal<K extends keyof MealAnalysis>(key: K, value: MealAnalysis[K]) {
    setAnalysis((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,390px)_1fr]">
      <section className="space-y-4 border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/30 p-3">
          <StepDot done={Boolean(file)} active={activeStep === 1} label="写真" />
          <StepDot done={Boolean(analysis)} active={activeStep === 2} label="解析" />
          <StepDot done={false} active={activeStep === 3} label="確認" />
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">今日の解析</p>
            <p className="text-sm font-semibold text-primary">
              {usage ? `残り ${usage.remaining} / ${usage.limit}` : "確認中"}
            </p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: usage
                  ? `${Math.min(100, Math.max(0, (usage.used / usage.limit) * 100))}%`
                  : "0%",
              }}
            />
          </div>
        </div>

        <label className="group flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
          {previewUrl ? (
            <div className="relative inline-block max-h-64 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="選択した食事写真"
                className="max-h-64 max-w-full rounded-md object-contain"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  clearSelectedImage();
                }}
                aria-label="画像を取り消し"
                className="absolute right-1 top-1 z-10 inline-flex size-7 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <>
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="size-6" />
              </span>
              <span className="text-base font-semibold">写真を選択</span>
              <span className="text-xs text-muted-foreground">5MB以下</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <button
          type="button"
          onClick={analyze}
          disabled={isAnalyzing || limitBlocked}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {limitBlocked ? "本日の上限に達しました" : file ? "この写真を解析" : "食事写真を解析"}
        </button>

        {notice ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>

      <section className="space-y-5 border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">確認して記録</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              推定値は変更できます。登録後、今日の合計に反映されます。
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!analysis || isSaving}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background shadow-sm disabled:opacity-50 sm:w-auto"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            今日の食事に記録
          </button>
        </div>

        {!analysis ? (
          <div className="rounded-md border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            写真を解析すると、ここに推定値が表示されます。
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              <label className="col-span-2 block text-sm font-medium">
                食事日時
                <input
                  type="datetime-local"
                  value={eatenAt}
                  onChange={(event) => setEatenAt(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium">
                kcal
                <input
                  type="number"
                  value={analysis.total_calories}
                  onChange={(event) =>
                    updateMeal("total_calories", numberValue(event.target.value))
                  }
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium">
                P
                <input
                  type="number"
                  value={analysis.protein}
                  onChange={(event) => updateMeal("protein", numberValue(event.target.value))}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium">
                F
                <input
                  type="number"
                  value={analysis.fat}
                  onChange={(event) => updateMeal("fat", numberValue(event.target.value))}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium">
                C
                <input
                  type="number"
                  value={analysis.carbs}
                  onChange={(event) => updateMeal("carbs", numberValue(event.target.value))}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              メモ
              <textarea
                value={analysis.memo}
                onChange={(event) => updateMeal("memo", event.target.value)}
                className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">料理ごとの内訳</h3>
                <button
                  type="button"
                  onClick={() =>
                    updateMeal("items", [
                      ...analysis.items,
                      {
                        name: "",
                        estimated_amount: "",
                        calories: 0,
                        protein: 0,
                        fat: 0,
                        carbs: 0,
                        confidence: 0,
                      },
                    ])
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
                >
                  <Plus className="size-4" />
                  追加
                </button>
              </div>

              {analysis.items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-8">
                  <input
                    value={item.name}
                    aria-label="料理名"
                    onChange={(event) => {
                      const items = [...analysis.items];
                      items[index] = { ...item, name: event.target.value };
                      updateMeal("items", items);
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:col-span-2"
                    placeholder="料理名"
                  />
                  <input
                    value={item.estimated_amount}
                    aria-label="推定量"
                    onChange={(event) => {
                      const items = [...analysis.items];
                      items[index] = { ...item, estimated_amount: event.target.value };
                      updateMeal("items", items);
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:col-span-2"
                    placeholder="推定量"
                  />
                  {(["calories", "protein", "fat", "carbs"] as const).map((key) => (
                    <input
                      key={key}
                      type="number"
                      value={item[key]}
                      aria-label={key}
                      onChange={(event) => {
                        const items = [...analysis.items];
                        items[index] = { ...item, [key]: numberValue(event.target.value) };
                        updateMeal("items", items);
                      }}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="削除"
                    onClick={() => {
                      updateMeal(
                        "items",
                        analysis.items.filter((_, itemIndex) => itemIndex !== index),
                      );
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border hover:bg-muted"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
