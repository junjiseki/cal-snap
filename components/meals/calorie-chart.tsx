"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { lastNJstDaysAsc } from "@/lib/japan-calendar";
import { CALORIE_OVER_WARN_THRESHOLD_KCAL } from "@/lib/meal-analysis";

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type ChartDataPoint = {
  day: string;
  label: string;
  calories: number;
  diff: number;
  protein: number;
  fat: number;
  carbs: number;
};

const chartConfig = {
  calories: {
    label: "摂取カロリー",
    theme: {
      light: "oklch(0.78 0.11 170)",
      dark: "oklch(0.82 0.09 170)",
    },
  },
  caloriesOverWarn: {
    label: `摂取カロリー（基準+${CALORIE_OVER_WARN_THRESHOLD_KCAL}kcal以内超過）`,
    theme: {
      light: "oklch(0.88 0.14 95)",
      dark: "oklch(0.9 0.13 95)",
    },
  },
  caloriesOver: {
    label: `摂取カロリー（基準+${CALORIE_OVER_WARN_THRESHOLD_KCAL}kcal超過）`,
    theme: {
      light: "oklch(0.55 0.22 27)",
      dark: "oklch(0.62 0.2 25)",
    },
  },
  protein: {
    label: "たんぱく質",
    theme: {
      light: "oklch(0.67 0.17 245)",
      dark: "oklch(0.73 0.14 245)",
    },
  },
  fat: {
    label: "脂質",
    theme: {
      light: "oklch(0.79 0.16 82)",
      dark: "oklch(0.84 0.14 82)",
    },
  },
  carbs: {
    label: "炭水化物",
    theme: {
      light: "oklch(0.72 0.16 155)",
      dark: "oklch(0.78 0.13 155)",
    },
  },
} satisfies ChartConfig;

/** Tailwind の `sm`（既定 640px）と同じ値に保つこと */
const SM_BREAKPOINT_PX = 640;

/** display:none 下で Recharts が 0×0 を測定しないよう、`sm` 境界で片方だけマウントする */
function useIsSmUp() {
  const [isSmUp, setIsSmUp] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${SM_BREAKPOINT_PX}px)`);
    const apply = () => setIsSmUp(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isSmUp;
}

function barFillForCalories(calories: number, goalCalories: number): string {
  if (calories <= goalCalories) return "var(--color-calories)";
  if (calories - goalCalories <= CALORIE_OVER_WARN_THRESHOLD_KCAL) {
    return "var(--color-caloriesOverWarn)";
  }
  return "var(--color-caloriesOver)";
}

function DailyCaloriesBarChart({
  data,
  goalCalories,
  heightClassName,
  xTickInterval,
  showGoalLabel,
}: {
  data: ChartDataPoint[];
  goalCalories: number;
  heightClassName: string;
  xTickInterval: number | "preserveStartEnd";
  showGoalLabel: boolean;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className={`${heightClassName} w-full min-w-0 [&_.recharts-responsive-container]:min-h-px`}
    >
      <BarChart accessibilityLayer data={data} margin={{ bottom: 0, left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={xTickInterval}
          minTickGap={6}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value) => `${Math.round(Number(value))}`}
          tickMargin={6}
          width={44}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                if (name === "calories") {
                  const payload = item?.payload as { diff?: number } | undefined;
                  const diff = payload?.diff ?? 0;
                  const sign = diff > 0 ? "+" : "";
                  return [`${value} kcal (${sign}${diff} kcal)`, "摂取 / 目安差"];
                }
                return [`${value}`, String(name)];
              }}
            />
          }
        />
        <ReferenceLine
          y={goalCalories}
          stroke="var(--muted-foreground)"
          strokeDasharray="6 6"
          ifOverflow="extendDomain"
          label={
            showGoalLabel
              ? {
                  value: `基準値 ${goalCalories} kcal`,
                  position: "insideTopRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }
              : undefined
          }
        />
        <Bar dataKey="calories" radius={[6, 6, 3, 3]} maxBarSize={42}>
          {data.map((entry) => (
            <Cell key={entry.day} fill={barFillForCalories(entry.calories, goalCalories)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function DailyPfcLineChart({
  data,
  heightClassName,
  xTickInterval,
}: {
  data: ChartDataPoint[];
  heightClassName: string;
  xTickInterval: number | "preserveStartEnd";
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className={`${heightClassName} w-full min-w-0 [&_.recharts-responsive-container]:min-h-px`}
    >
      <LineChart accessibilityLayer data={data} margin={{ bottom: 0, left: 4, right: 8, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={xTickInterval}
          minTickGap={6}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value) => `${Math.round(Number(value))}g`}
          tickMargin={6}
          width={44}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label =
                  name === "protein"
                    ? "たんぱく質"
                    : name === "fat"
                      ? "脂質"
                      : name === "carbs"
                        ? "炭水化物"
                        : String(name);
                return [`${Math.round(Number(value))} g`, label];
              }}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="protein"
          stroke="var(--color-protein)"
          strokeWidth={2.5}
          dot={{ r: 2.5, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="fat"
          stroke="var(--color-fat)"
          strokeWidth={2.5}
          dot={{ r: 2.5, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="carbs"
          stroke="var(--color-carbs)"
          strokeWidth={2.5}
          dot={{ r: 2.5, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function CalorieChart({
  meals,
  goalCalories,
  chartEndDate,
}: {
  meals: MealRow[];
  goalCalories: number;
  /** JST の YYYY-MM-DD（直近14日の終端＝通常は「今日」） */
  chartEndDate: string;
}) {
  const isSmUp = useIsSmUp();

  if (isSmUp === null) {
    return (
      <div
        className="max-w-full min-h-112 min-w-0 rounded-md bg-muted/15"
        aria-busy="true"
        aria-label="グラフを読み込み中"
      />
    );
  }

  const dayFmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const grouped = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>();
  for (const meal of meals) {
    const day = dayFmt.format(new Date(meal.eaten_at));
    const current = grouped.get(day) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    grouped.set(day, {
      calories: current.calories + meal.total_calories,
      protein: current.protein + Number(meal.protein ?? 0),
      fat: current.fat + Number(meal.fat ?? 0),
      carbs: current.carbs + Number(meal.carbs ?? 0),
    });
  }

  const chartData = lastNJstDaysAsc(14, chartEndDate).map((day) => {
    const totals = grouped.get(day) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    return {
      day,
      label: day.slice(5),
      calories: totals.calories,
      diff: totals.calories - goalCalories,
      protein: Math.round(totals.protein),
      fat: Math.round(totals.fat),
      carbs: Math.round(totals.carbs),
    };
  });
  const mobileChartData = chartData.slice(-7);
  const activeMobileDays = mobileChartData.filter((day) => day.calories > 0);
  const mobileAverageCalories = activeMobileDays.length
    ? Math.round(
        activeMobileDays.reduce((sum, day) => sum + day.calories, 0) / activeMobileDays.length,
      )
    : 0;
  const mobileMaxCalories = Math.max(...mobileChartData.map((day) => day.calories), 0);
  const latestRecordedDay = [...mobileChartData].reverse().find((day) => day.calories > 0);
  const latestDiff = latestRecordedDay ? latestRecordedDay.calories - goalCalories : 0;
  const latestDiffLabel =
    latestDiff > 0
      ? `目安より ${latestDiff} kcal 多め`
      : latestDiff < 0
        ? `目安まで ${Math.abs(latestDiff)} kcal`
        : "目安ぴったり";

  return (
    <div className="max-w-full min-w-0">
      {!isSmUp ? (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[11px] text-muted-foreground">直近7日の平均</p>
              <p className="mt-1 text-base font-bold">{mobileAverageCalories} kcal</p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[11px] text-muted-foreground">最大</p>
              <p className="mt-1 text-base font-bold">{mobileMaxCalories} kcal</p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[11px] text-muted-foreground">最新</p>
              <p className="mt-1 text-xs font-bold leading-5 text-primary">{latestDiffLabel}</p>
            </div>
          </div>
          <div className="-mx-2 overflow-x-auto px-2" aria-label="カロリー推移を横にスライドして確認">
            <div className="min-w-[430px]">
              <DailyCaloriesBarChart
                data={mobileChartData}
                goalCalories={goalCalories}
                heightClassName="h-[230px]"
                xTickInterval={0}
                showGoalLabel={false}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>縦軸: kcal / 破線: 目安 {goalCalories} kcal</span>
            <span>直近7日</span>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">PFC推移</h3>
              <PfcLegend />
            </div>
            <DailyPfcLineChart data={mobileChartData} heightClassName="h-[190px]" xTickInterval={0} />
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">カロリー</h3>
            <DailyCaloriesBarChart
              data={chartData}
              goalCalories={goalCalories}
              heightClassName="h-[240px]"
              xTickInterval="preserveStartEnd"
              showGoalLabel
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">PFC</h3>
              <PfcLegend />
            </div>
            <DailyPfcLineChart
              data={chartData}
              heightClassName="h-[240px]"
              xTickInterval="preserveStartEnd"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PfcLegend() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="size-2 rounded-full bg-sky-500" />P
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="size-2 rounded-full bg-yellow-400" />F
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="size-2 rounded-full bg-emerald-500" />C
      </span>
    </div>
  );
}
