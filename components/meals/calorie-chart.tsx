"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
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
};

type ChartDataPoint = {
  day: string;
  label: string;
  calories: number;
  diff: number;
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
} satisfies ChartConfig;

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
    <ChartContainer config={chartConfig} className={`${heightClassName} w-full`}>
      <BarChart accessibilityLayer data={data} margin={{ bottom: 0, left: -8, right: 4, top: 8 }}>
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
          tickFormatter={(value) => `${Math.round(Number(value) / 100) / 10}k`}
          tickMargin={4}
          width={30}
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
  const dayFmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const grouped = new Map<string, number>();
  for (const meal of meals) {
    const day = dayFmt.format(new Date(meal.eaten_at));
    grouped.set(day, (grouped.get(day) ?? 0) + meal.total_calories);
  }

  const chartData = lastNJstDaysAsc(14, chartEndDate).map((day) => {
    const calories = grouped.get(day) ?? 0;
    return {
      day,
      label: day.slice(5),
      calories,
      diff: calories - goalCalories,
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
    <div className="max-w-full">
      <div className="sm:hidden">
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
        <DailyCaloriesBarChart
          data={mobileChartData}
          goalCalories={goalCalories}
          heightClassName="h-[230px]"
          xTickInterval={0}
          showGoalLabel={false}
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>破線: 目安 {goalCalories} kcal</span>
          <span>直近7日</span>
        </div>
      </div>

      <div className="hidden sm:block">
        <DailyCaloriesBarChart
          data={chartData}
          goalCalories={goalCalories}
          heightClassName="h-[240px]"
          xTickInterval="preserveStartEnd"
          showGoalLabel
        />
      </div>
    </div>
  );
}
