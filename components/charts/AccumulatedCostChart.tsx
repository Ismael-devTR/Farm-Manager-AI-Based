"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FeedRecord = { date: Date; quantityKg: number; costPerKg: number };
type Expense = { date: Date; amount: number };

type Props = {
  animalCost: number;
  feedRecords: FeedRecord[];
  expenses: Expense[];
};

export default function AccumulatedCostChart({ animalCost, feedRecords, expenses }: Props) {
  // Build a timeline of all events sorted by date
  type Event = { date: Date; amount: number };
  const events: Event[] = [
    ...feedRecords.map((r) => ({ date: new Date(r.date), amount: r.quantityKg * r.costPerKg })),
    ...expenses.map((e) => ({ date: new Date(e.date), amount: e.amount })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        No cost data yet.
      </div>
    );
  }

  let accumulated = animalCost;
  const data = events.map((e) => {
    accumulated += e.amount;
    return {
      date: e.date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      total: parseFloat(accumulated.toFixed(2)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 12 }}
          width={64}
        />
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Accumulated cost"]} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#costGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
