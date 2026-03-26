"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useDict } from "@/components/LocaleProvider";

type ChartPoint = {
  label: string;
  actual?: number;
  projected?: number;
};

type Props = {
  feedRecords: { date: Date; quantityKg: number }[];
  avgDailyKg: number;
  totalFeedConsumed: number;
  projectedTotalFeedKg: number;
  estimatedFinishDate: Date;
};

export default function FeedProjectionChart({
  feedRecords,
  avgDailyKg,
  totalFeedConsumed,
  projectedTotalFeedKg,
  estimatedFinishDate,
}: Props) {
  const dict = useDict();
  const t = dict.feedProjection;

  // ── Historical: cumulative kg per day ──────────────────────────────────────
  const sorted = [...feedRecords].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulative = 0;
  const actualPoints: ChartPoint[] = sorted.map((r) => {
    cumulative += r.quantityKg;
    return {
      label: new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      actual: parseFloat(cumulative.toFixed(1)),
    };
  });

  // ── Projection: from today to finish, weekly intervals ────────────────────
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const msPerWeek = msPerDay * 7;
  const totalMs = estimatedFinishDate.getTime() - now.getTime();
  const steps = Math.max(2, Math.min(8, Math.ceil(totalMs / msPerWeek)));
  const stepMs = totalMs / steps;

  const projectedPoints: ChartPoint[] = [];

  // Anchor: connect projection to the last actual point
  projectedPoints.push({
    label: now.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    projected: parseFloat(totalFeedConsumed.toFixed(1)),
  });

  for (let i = 1; i <= steps; i++) {
    const date = new Date(now.getTime() + stepMs * i);
    const daysAhead = (stepMs * i) / msPerDay;
    const projKg = Math.min(
      projectedTotalFeedKg,
      totalFeedConsumed + avgDailyKg * daysAhead
    );
    projectedPoints.push({
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      projected: parseFloat(projKg.toFixed(1)),
    });
  }

  // ── Merge: keep historical then projected, avoiding duplicate labels ───────
  const projLabels = new Set(projectedPoints.map((p) => p.label));
  const filteredActual = actualPoints.filter((p) => !projLabels.has(p.label));
  const data: ChartPoint[] = [...filteredActual, ...projectedPoints];

  const todayLabel = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis unit=" kg" tick={{ fontSize: 11 }} width={60} />
        <Tooltip
          formatter={(v, name) => [
            `${Number(v).toFixed(0)} kg`,
            name === "actual" ? t.chartActual : t.chartProjected,
          ]}
        />
        <Legend
          formatter={(value) =>
            value === "actual" ? t.chartActual : t.chartProjected
          }
        />
        <ReferenceLine
          x={todayLabel}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: t.chartToday, position: "top", fontSize: 11, fill: "#f59e0b" }}
        />
        {/* Target line */}
        <ReferenceLine
          y={projectedTotalFeedKg}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: t.chartTarget, position: "right", fontSize: 11, fill: "#ef4444" }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3, fill: "#16a34a" }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="projected"
          stroke="#60a5fa"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={{ r: 3, fill: "#60a5fa" }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
