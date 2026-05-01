"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type MealRow = {
  id: string;
  eaten_at: string;
  total_calories: number;
};

const OVER_WARN_KCAL = 300;

const chartConfig = {
  calories: {
    label: "摂取カロリー",
    theme: {
      light: "oklch(0.78 0.11 170)",
      dark: "oklch(0.82 0.09 170)",
    },
  },
  caloriesOverWarn: {
    label: `摂取カロリー（基準+${OVER_WARN_KCAL}kcal以内超過）`,
    theme: {
      light: "oklch(0.88 0.14 95)",
      dark: "oklch(0.9 0.13 95)",
    },
  },
  caloriesOver: {
    label: `摂取カロリー（基準+${OVER_WARN_KCAL}kcal超過）`,
    theme: {
      light: "oklch(0.78 0.16 28)",
      dark: "oklch(0.8 0.14 28)",
    },
  },
} satisfies ChartConfig;

function barFillForCalories(calories: number, goalCalories: number): string {
  if (calories <= goalCalories) return "var(--color-calories)";
  if (calories - goalCalories <= OVER_WARN_KCAL) return "var(--color-caloriesOverWarn)";
  return "var(--color-caloriesOver)";
}

export function CalorieChart({
  meals,
  goalCalories,
}: {
  meals: MealRow[];
  goalCalories: number;
}) {
  const grouped = new Map<string, number>();
  for (const meal of meals) {
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(meal.eaten_at));
    grouped.set(day, (grouped.get(day) ?? 0) + meal.total_calories);
  }

  const chartData = Array.from(grouped.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, calories]) => ({
      day,
      label: day.slice(5),
      calories,
      diff: calories - goalCalories,
    }));

  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
      <ChartContainer
        config={chartConfig}
        className="h-[200px] min-w-[min(100%,320px)] w-full sm:h-[240px]"
      >
        <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            minTickGap={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={6} width={40} tick={{ fontSize: 11 }} />
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
            label={{
              value: `基準値 ${goalCalories} kcal`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="calories" radius={6}>
            {chartData.map((entry) => (
              <Cell key={entry.day} fill={barFillForCalories(entry.calories, goalCalories)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
