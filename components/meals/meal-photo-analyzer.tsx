"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Images,
  Keyboard,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { dashboardDateHref, toJapanYmd } from "@/lib/japan-calendar";
import {
  MAX_MEAL_ITEMS_PER_MEAL,
  type MealAnalysis,
  getCalorieOverLevel,
  toConfidence,
  toInteger,
} from "@/lib/meal-analysis";

type MacroInput = number | "";

type MealItemForm = Omit<MealAnalysis["items"][number], "calories" | "protein" | "fat" | "carbs"> & {
  calories: MacroInput;
  protein: MacroInput;
  fat: MacroInput;
  carbs: MacroInput;
};

type MealAnalysisForm = Omit<MealAnalysis, "total_calories" | "protein" | "fat" | "carbs" | "items"> & {
  total_calories: MacroInput;
  protein: MacroInput;
  fat: MacroInput;
  carbs: MacroInput;
  items: MealItemForm[];
};

type ApiError = {
  error?: {
    message?: string;
    code?: string;
  };
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_CLIENT_IMAGE_BYTES = 5 * 1024 * 1024;

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

function macroNum(v: MacroInput): number {
  if (v === "") return 0;
  return v;
}

function createManualMealDraft(): MealAnalysisForm {
  return {
    memo: "",
    total_calories: "",
    protein: "",
    fat: "",
    carbs: "",
    ai_confidence: 1,
    items: [
      {
        name: "",
        estimated_amount: "",
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
        confidence: 1,
      },
    ],
  };
}

function mealAnalysisToForm(analysis: MealAnalysis): MealAnalysisForm {
  return {
    ...analysis,
    total_calories: analysis.total_calories,
    protein: analysis.protein,
    fat: analysis.fat,
    carbs: analysis.carbs,
    items: analysis.items.map((item) => ({
      ...item,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
    })),
  };
}

function sumItemsMacros(items: MealItemForm[]) {
  return {
    total_calories: toInteger(items.reduce((s, i) => s + macroNum(i.calories), 0)),
    protein: toInteger(items.reduce((s, i) => s + macroNum(i.protein), 0)),
    fat: toInteger(items.reduce((s, i) => s + macroNum(i.fat), 0)),
    carbs: toInteger(items.reduce((s, i) => s + macroNum(i.carbs), 0)),
  };
}

type EntryMode = "photo" | "manual";

function isMealFormMacroComplete(form: MealAnalysisForm, entryMode: EntryMode): boolean {
  if (entryMode === "manual" && form.items.length === 0) {
    return false;
  }
  for (const item of form.items) {
    if (item.calories === "" || item.protein === "" || item.fat === "" || item.carbs === "") {
      return false;
    }
  }
  if (entryMode === "manual") {
    return true;
  }
  if (form.total_calories === "" || form.protein === "" || form.fat === "" || form.carbs === "") {
    return false;
  }
  return true;
}

function mealFormToMealAnalysis(form: MealAnalysisForm, entryMode: EntryMode): MealAnalysis {
  const num = (m: MacroInput): number => toInteger(Number(m));
  const totals =
    entryMode === "manual"
      ? sumItemsMacros(form.items)
      : {
          total_calories: num(form.total_calories),
          protein: num(form.protein),
          fat: num(form.fat),
          carbs: num(form.carbs),
        };
  return {
    memo: form.memo,
    total_calories: totals.total_calories,
    protein: totals.protein,
    fat: totals.fat,
    carbs: totals.carbs,
    ai_confidence: toConfidence(form.ai_confidence),
    items: form.items.map((item) => ({
      name: item.name,
      estimated_amount: item.estimated_amount,
      calories: num(item.calories),
      protein: num(item.protein),
      fat: num(item.fat),
      carbs: num(item.carbs),
      confidence: toConfidence(item.confidence),
    })),
  };
}

function normalizeMealAnalysis(analysis: MealAnalysis): MealAnalysis {
  return {
    ...analysis,
    total_calories: toInteger(analysis.total_calories),
    protein: toInteger(Number(analysis.protein)),
    fat: toInteger(Number(analysis.fat)),
    carbs: toInteger(Number(analysis.carbs)),
    ai_confidence: toConfidence(analysis.ai_confidence),
    items: analysis.items.map((item) => ({
      ...item,
      calories: toInteger(item.calories),
      protein: toInteger(Number(item.protein)),
      fat: toInteger(Number(item.fat)),
      carbs: toInteger(Number(item.carbs)),
      confidence: toConfidence(item.confidence),
    })),
  };
}

async function readError(response: Response) {
  try {
    const data = (await response.json()) as ApiError;
    return data.error?.message || "処理に失敗しました。";
  } catch {
    return "処理に失敗しました。";
  }
}

const macroFieldStyle = {
  calories: {
    label: "カロリー",
    unit: "kcal",
    bar: "border-l-violet-500",
    tint: "bg-violet-50/60 dark:bg-violet-950/25",
    labelClass: "text-violet-900 dark:text-violet-200",
  },
  protein: {
    label: "たんぱく質",
    unit: "g",
    bar: "border-l-sky-600",
    tint: "bg-sky-50/70 dark:bg-sky-950/30",
    labelClass: "text-sky-900 dark:text-sky-200",
  },
  fat: {
    label: "脂質",
    unit: "g",
    bar: "border-l-amber-600",
    tint: "bg-amber-50/70 dark:bg-amber-950/25",
    labelClass: "text-amber-950 dark:text-amber-200",
  },
  carbs: {
    label: "炭水化物",
    unit: "g",
    bar: "border-l-orange-600",
    tint: "bg-orange-50/70 dark:bg-orange-950/25",
    labelClass: "text-orange-950 dark:text-orange-200",
  },
} as const;

/** 料理行・合計行で同じボックス高さに揃える（ラベル帯 + h-10 入力） */
const METRIC_BOX = "flex min-h-24 h-full flex-col rounded-md border border-input p-2.5";

function TextMetricField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={`${METRIC_BOX} h-full bg-background`}>
      <span className="flex min-h-8 shrink-0 items-center text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="mt-2 flex min-h-10 flex-1 flex-col justify-end">{children}</div>
    </div>
  );
}

function MacroNumberField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: keyof typeof macroFieldStyle;
  value: MacroInput;
  onChange: (v: MacroInput) => void;
}) {
  const meta = macroFieldStyle[fieldKey];
  return (
    <label
      className={[
        METRIC_BOX,
        "h-full border-l-4 bg-background",
        meta.bar,
        meta.tint,
      ].join(" ")}
    >
      <span className="flex min-h-8 shrink-0 items-center justify-between gap-1 text-xs leading-tight">
        <span className={["font-semibold", meta.labelClass].join(" ")}>{meta.label}</span>
        <span className="shrink-0 text-muted-foreground">({meta.unit})</span>
      </span>
      <input
        type="number"
        step={1}
        min={0}
        value={value === "" ? "" : value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          onChange(toInteger(parsed));
        }}
        className="mt-2 h-10 w-full shrink-0 rounded-md border border-transparent bg-background/80 px-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function MacroReadOnlyField({
  fieldKey,
  value,
}: {
  fieldKey: keyof typeof macroFieldStyle;
  value: number;
}) {
  const meta = macroFieldStyle[fieldKey];
  return (
    <div
      className={[
        METRIC_BOX,
        "h-full border-l-4 bg-background",
        meta.bar,
        meta.tint,
      ].join(" ")}
    >
      <span className="flex min-h-8 shrink-0 items-center justify-between gap-1 text-xs leading-tight">
        <span className={["font-semibold", meta.labelClass].join(" ")}>{meta.label}</span>
        <span className="shrink-0 text-muted-foreground">({meta.unit})</span>
      </span>
      <output
        className="mt-2 flex h-10 w-full shrink-0 items-center rounded-md border border-transparent bg-background/80 px-2 text-sm tabular-nums text-foreground"
        aria-label={`${meta.label}（${meta.unit}）の合計`}
      >
        {toInteger(value)}
      </output>
    </div>
  );
}

function calorieOverBadgeClass(level: ReturnType<typeof getCalorieOverLevel>) {
  return [
    "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
    level === "none" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300",
    level === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    level === "severe" && "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-300",
  ]
    .filter(Boolean)
    .join(" ");
}

function calorieOverBarClass(level: ReturnType<typeof getCalorieOverLevel>) {
  return [
    "h-1.5 rounded-full transition-all",
    level === "none" && "bg-primary",
    level === "warn" && "bg-amber-500 dark:bg-amber-400",
    level === "severe" && "bg-red-500",
  ]
    .filter(Boolean)
    .join(" ");
}

function MealDayCalorieSnapshot({
  consumed,
  goal,
  draftMealKcal,
}: {
  consumed: number;
  goal: number;
  draftMealKcal: number | null;
}) {
  const safeGoal = Math.max(goal, 1);
  const overLevel = getCalorieOverLevel(consumed, goal);
  const calorieDelta = goal - consumed;
  const calorieRemainOrOver =
    calorieDelta >= 0
      ? `あと ${calorieDelta} kcal`
      : `目安を ${Math.abs(calorieDelta)} kcal 超過`;
  const progress = Math.min(100, Math.round((consumed / safeGoal) * 100));

  const projected =
    draftMealKcal != null && draftMealKcal > 0 ? consumed + draftMealKcal : null;
  const projectedLevel =
    projected !== null ? getCalorieOverLevel(projected, goal) : null;
  const projectedDeltaLabel =
    projected !== null
      ? goal - projected >= 0
        ? `あと ${goal - projected} kcal`
        : `目安を ${Math.abs(goal - projected)} kcal 超過`
      : null;

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">今日の摂取（登録済み）</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight">
            {consumed}
            <span className="ml-1 text-xs font-normal text-muted-foreground">kcal</span>
          </p>
        </div>
        <div className={calorieOverBadgeClass(overLevel)}>
          {overLevel !== "none" ? (
            <TrendingUp className="size-3.5 shrink-0" />
          ) : (
            <TrendingDown className="size-3.5 shrink-0" />
          )}
          {calorieRemainOrOver}
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div className={calorieOverBarClass(overLevel)} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        目安 {goal} kcal / {progress}%
      </p>
      {projected !== null && projectedLevel !== null && projectedDeltaLabel !== null ? (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-[11px] text-muted-foreground">この内容で保存すると</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{projected} kcal</span>
            <div className={calorieOverBadgeClass(projectedLevel)}>
              {projectedLevel !== "none" ? (
                <TrendingUp className="size-3.5 shrink-0" />
              ) : (
                <TrendingDown className="size-3.5 shrink-0" />
              )}
              {projectedDeltaLabel}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
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

export function MealPhotoAnalyzer({
  initialEntryMode,
  initialEatenAtLocal,
  plan = "free",
}: {
  initialEntryMode?: EntryMode;
  /** datetime-local 用（例: YYYY-MM-DDTHH:mm）。日付のみの指定は呼び出し側で時刻を付与 */
  initialEatenAtLocal?: string;
  plan?: "free" | "paid";
} = {}) {
  const canUseManualEntry = plan === "paid";
  const router = useRouter();
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const saveInFlightRef = useRef(false);
  const [entryMode, setEntryMode] = useState<EntryMode>(() =>
    initialEntryMode === "manual" && canUseManualEntry ? "manual" : "photo",
  );
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysisForm | null>(() =>
    initialEntryMode === "manual" && canUseManualEntry ? createManualMealDraft() : null,
  );
  const [eatenAt, setEatenAt] = useState(() => initialEatenAtLocal ?? todayInputValue());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(
    null,
  );
  const [daySnapshot, setDaySnapshot] = useState<{ consumed: number; goal: number } | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);
  const limitBlocked = (usage?.remaining ?? 1) <= 0;
  const activeStep = analysis ? 3 : file ? 2 : 1;

  function clearFileInputs() {
    if (cameraFileInputRef.current) cameraFileInputRef.current.value = "";
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
  }

  function selectEntryMode(mode: EntryMode) {
    if (mode === "manual" && !canUseManualEntry) {
      setEntryMode("photo");
      setAnalysis(null);
      setError("手入力での記録は有料プランで利用できます。無料プランでは写真解析をご利用ください。");
      setNotice(null);
      return;
    }
    setError(null);
    setNotice(null);
    setFile(null);
    clearFileInputs();
    setEntryMode(mode);
    if (mode === "photo") {
      setAnalysis(null);
    } else {
      setAnalysis(createManualMealDraft());
    }
  }

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
          goalCalories?: number;
          todaySummaryOk?: boolean;
          todayCalories?: number;
        };
        if (!mounted) return;
        setUsage(data.usage);
        if (
          data.todaySummaryOk === true &&
          typeof data.todayCalories === "number" &&
          typeof data.goalCalories === "number"
        ) {
          setDaySnapshot({ consumed: data.todayCalories, goal: data.goalCalories });
        }
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
    if (selected && !ALLOWED_IMAGE_TYPES.has(selected.type)) {
      setFile(null);
      setError("JPEG、PNG、WebP の画像を選択してください。");
      clearFileInputs();
      return;
    }
    if (selected && selected.size > MAX_CLIENT_IMAGE_BYTES) {
      setFile(null);
      setError("画像サイズは5MB以下にしてください。");
      clearFileInputs();
      return;
    }
    setFile(selected);
  }

  function clearSelectedImage() {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setNotice(null);
    clearFileInputs();
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
      setAnalysis(mealAnalysisToForm(normalizeMealAnalysis(data.analysis)));
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
    if (!analysis) {
      setError(
        entryMode === "manual"
          ? "入力内容を確認してから登録してください。"
          : "AI推定結果を確認してから登録してください。",
      );
      return;
    }

    if (!isMealFormMacroComplete(analysis, entryMode)) {
      setError("数値が未入力の項目があります。すべて埋めてから登録してください。");
      return;
    }

    const payload = mealFormToMealAnalysis(analysis, entryMode);

    if (saveInFlightRef.current) {
      return;
    }
    saveInFlightRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...normalizeMealAnalysis(payload),
          eaten_at: new Date(eatenAt).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      if (entryMode === "manual") {
        const dateYmd = toJapanYmd(new Date(eatenAt).toISOString());
        router.push(dashboardDateHref(dateYmd));
      } else {
        router.push("/meals/new");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "食事を登録できません。");
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  function updateMeal<K extends keyof MealAnalysisForm>(key: K, value: MealAnalysisForm[K]) {
    setAnalysis((current) => {
      if (!current) return current;
      if (key === "total_calories" || key === "protein" || key === "fat" || key === "carbs") {
        const v = value as MacroInput;
        return { ...current, [key]: v === "" ? "" : toInteger(Number(v)) };
      }
      if (key === "ai_confidence") {
        return { ...current, [key]: toConfidence(value as number) };
      }
      if (key === "items" && Array.isArray(value)) {
        return {
          ...current,
          items: (value as MealItemForm[]).map((item) => ({
            ...item,
            calories: item.calories === "" ? "" : toInteger(Number(item.calories)),
            protein: item.protein === "" ? "" : toInteger(Number(item.protein)),
            fat: item.fat === "" ? "" : toInteger(Number(item.fat)),
            carbs: item.carbs === "" ? "" : toInteger(Number(item.carbs)),
            confidence: toConfidence(item.confidence),
          })),
        };
      }
      return { ...current, [key]: value };
    });
  }

  function removeMealItemAt(index: number) {
    setAnalysis((current) => {
      if (!current) return current;
      const removed = current.items[index];
      if (!removed) return current;
      const nextItems = current.items.filter((_, i) => i !== index);
      if (entryMode === "manual") {
        return { ...current, items: nextItems };
      }
      return {
        ...current,
        items: nextItems,
        total_calories:
          current.total_calories === ""
            ? ""
            : toInteger(Math.max(0, macroNum(current.total_calories) - macroNum(removed.calories))),
        protein:
          current.protein === ""
            ? ""
            : toInteger(Math.max(0, macroNum(current.protein) - macroNum(removed.protein))),
        fat:
          current.fat === ""
            ? ""
            : toInteger(Math.max(0, macroNum(current.fat) - macroNum(removed.fat))),
        carbs:
          current.carbs === ""
            ? ""
            : toInteger(Math.max(0, macroNum(current.carbs) - macroNum(removed.carbs))),
      };
    });
  }

  const manualTotals = useMemo(
    () => (analysis ? sumItemsMacros(analysis.items) : null),
    [analysis],
  );

  const draftMealKcal = useMemo((): number | null => {
    if (!analysis) return null;
    if (entryMode === "photo") {
      if (analysis.total_calories === "") return null;
      return toInteger(Number(analysis.total_calories));
    }
    if (!isMealFormMacroComplete(analysis, entryMode)) return null;
    return manualTotals!.total_calories;
  }, [analysis, entryMode, manualTotals]);

  const canSaveMeal = analysis !== null && isMealFormMacroComplete(analysis, entryMode);
  const mealItemLimitReached = (analysis?.items.length ?? 0) >= MAX_MEAL_ITEMS_PER_MEAL;

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
      <section className="space-y-4 border border-border bg-card p-4 shadow-sm sm:p-5 lg:sticky lg:top-24">
        <div>
          <p className="text-xs font-semibold text-primary">STEP 1</p>
          <h2 className="mt-1 text-lg font-semibold">記録方法を選ぶ</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {canUseManualEntry
              ? "有料プラン: 写真解析と手入力が使えます。"
              : "無料プラン: 写真解析で記録できます。"}
          </p>
          {canUseManualEntry ? (
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground/70">
              上限: 1日8件 / 1食あたり料理{MAX_MEAL_ITEMS_PER_MEAL}件
            </p>
          ) : null}
        </div>

        <div
          className={[
            "grid gap-2 rounded-lg border border-border bg-muted/30 p-1",
            canUseManualEntry ? "grid-cols-2" : "grid-cols-1",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => selectEntryMode("photo")}
            aria-pressed={entryMode === "photo"}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
              entryMode === "photo"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Camera className="size-4 shrink-0" />
            写真
          </button>
          {canUseManualEntry ? (
            <button
              type="button"
              onClick={() => selectEntryMode("manual")}
              aria-pressed={entryMode === "manual"}
              className={[
                "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                entryMode === "manual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Keyboard className="size-4 shrink-0" />
              手入力
            </button>
          ) : null}
        </div>

        {entryMode === "photo" ? (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-3">
            <div className="grid grid-cols-3 gap-2">
              <StepDot done={Boolean(file)} active={activeStep === 1} label="写真" />
              <StepDot done={Boolean(analysis)} active={activeStep === 2} label="解析" />
              <StepDot done={false} active={activeStep === 3} label="確認" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">今日の解析枠</p>
                <p className="text-xs font-semibold text-primary">
                  {usage ? `残り ${usage.remaining} / ${usage.limit}` : "確認中"}
                </p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{
                    width: usage
                      ? `${Math.min(100, Math.max(0, (usage.used / usage.limit) * 100))}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold">手入力モード</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              AI解析は使いません（本日の解析回数は減りません）。右のフォームに栄養値を入力して保存してください。1食あたり料理{MAX_MEAL_ITEMS_PER_MEAL}件まで登録できます。
            </p>
          </div>
        )}

        {daySnapshot ? (
          <MealDayCalorieSnapshot
            consumed={daySnapshot.consumed}
            goal={daySnapshot.goal}
            draftMealKcal={draftMealKcal}
          />
        ) : null}

        {entryMode === "photo" ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
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
                  onClick={() => clearSelectedImage()}
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
                <div>
                  <p className="text-base font-semibold">写真を追加して解析</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    カメラ撮影か写真選択を選べます。5MB以下の JPEG / PNG / WebP に対応しています。
                  </p>
                </div>
                <div className="flex w-full max-w-md gap-2 flex-row justify-center">
                  <button
                    type="button"
                    onClick={() => cameraFileInputRef.current?.click()}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <Camera className="size-5 shrink-0" aria-hidden />
                    カメラ撮影
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <Images className="size-5 shrink-0" aria-hidden />
                    写真選択
                  </button>
                </div>
                <input
                  ref={cameraFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={handleFileChange}
                />
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        ) : null}

        {entryMode === "photo" ? (
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
        ) : null}

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
            <p className="text-xs font-semibold text-primary">STEP 2</p>
            <h2 className="mt-1 text-xl font-semibold">推定値を確認して保存</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {entryMode === "manual"
                ? "入力した値を確認し、保存前にいつでも修正できます。"
                : "推定値は保存前に変更できます。"}
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!canSaveMeal || isSaving}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background shadow-sm disabled:opacity-50 sm:w-auto"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            食事を記録
          </button>
        </div>

        {!analysis ? (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-5">
            <div className="flex gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {entryMode === "manual" ? <Keyboard className="size-5" /> : <Sparkles className="size-5" />}
              </span>
              <div>
                <h3 className="font-semibold">
                  {entryMode === "manual" ? "内訳を入力して保存できます" : "解析結果がここに表示されます"}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {entryMode === "manual"
                    ? "手入力モードでは、料理ごとのカロリーとPFCを入力すると合計が自動で計算されます。"
                    : "左側で写真を選んで解析すると、合計カロリー、PFC、料理ごとの内訳を確認・修正できます。"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                食事日時
                <input
                  type="datetime-local"
                  value={eatenAt}
                  onChange={(event) => setEatenAt(event.target.value)}
                  className="mt-2 h-11 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <div>
                <p className="text-sm font-semibold">1食あたりの合計（推定）</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entryMode === "manual"
                    ? "料理ごとの内訳を足し合わせた値です。編集は内訳の数値から行ってください。"
                    : "左の色帯で栄養素を区別しています。PFC はグラム（g）、カロリーは kcal です。"}
                </p>
                <div className="mt-3 grid grid-cols-2 items-stretch gap-3 lg:grid-cols-4">
                  {entryMode === "manual" && manualTotals ? (
                    <>
                      <MacroReadOnlyField fieldKey="calories" value={manualTotals.total_calories} />
                      <MacroReadOnlyField fieldKey="protein" value={manualTotals.protein} />
                      <MacroReadOnlyField fieldKey="fat" value={manualTotals.fat} />
                      <MacroReadOnlyField fieldKey="carbs" value={manualTotals.carbs} />
                    </>
                  ) : (
                    <>
                      <MacroNumberField
                        fieldKey="calories"
                        value={analysis.total_calories}
                        onChange={(v) => updateMeal("total_calories", v)}
                      />
                      <MacroNumberField
                        fieldKey="protein"
                        value={analysis.protein}
                        onChange={(v) => updateMeal("protein", v)}
                      />
                      <MacroNumberField
                        fieldKey="fat"
                        value={analysis.fat}
                        onChange={(v) => updateMeal("fat", v)}
                      />
                      <MacroNumberField
                        fieldKey="carbs"
                        value={analysis.carbs}
                        onChange={(v) => updateMeal("carbs", v)}
                      />
                    </>
                  )}
                </div>
              </div>
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
                  disabled={mealItemLimitReached}
                  onClick={() =>
                    updateMeal("items", [
                      ...analysis.items,
                      entryMode === "manual"
                        ? {
                            name: "",
                            estimated_amount: "",
                            calories: "",
                            protein: "",
                            fat: "",
                            carbs: "",
                            confidence: 1,
                          }
                        : {
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
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  追加
                </button>
              </div>
              {mealItemLimitReached ? (
                <p className="text-sm text-muted-foreground">
                  1つの食事に登録できる料理は{MAX_MEAL_ITEMS_PER_MEAL}件までです。
                </p>
              ) : null}

              {analysis.items.map((item, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-md border border-border bg-muted/10 p-3 sm:space-y-0"
                >
                  <p className="text-xs font-semibold text-muted-foreground sm:hidden">
                    料理 {index + 1}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_repeat(4,minmax(0,6.5rem))_auto] lg:items-stretch">
                    <TextMetricField label="料理名">
                      <input
                        value={item.name}
                        aria-label="料理名"
                        onChange={(event) => {
                          const items = [...analysis.items];
                          items[index] = { ...item, name: event.target.value };
                          updateMeal("items", items);
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="例: カレー"
                      />
                    </TextMetricField>
                    <TextMetricField label="推定量">
                      <input
                        value={item.estimated_amount}
                        aria-label="推定量"
                        onChange={(event) => {
                          const items = [...analysis.items];
                          items[index] = { ...item, estimated_amount: event.target.value };
                          updateMeal("items", items);
                        }}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="例: 1皿"
                      />
                    </TextMetricField>
                    {(["calories", "protein", "fat", "carbs"] as const).map((key) => (
                      <MacroNumberField
                        key={key}
                        fieldKey={key}
                        value={item[key]}
                        onChange={(v) => {
                          const items = [...analysis.items];
                          items[index] = { ...item, [key]: v };
                          updateMeal("items", items);
                        }}
                      />
                    ))}
                    <div className="flex min-h-24 items-stretch sm:col-span-2 lg:col-span-1">
                      <button
                        type="button"
                        aria-label="この料理を削除"
                        onClick={() => removeMealItemAt(index)}
                        className="flex h-full w-full min-h-10 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
