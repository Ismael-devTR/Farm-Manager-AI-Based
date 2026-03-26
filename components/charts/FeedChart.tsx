"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  records: { date: Date; feedType: string; quantityKg: number; costPerKg: number }[];
};

export default function FeedChart({ records }: Props) {
  if (records.length === 0) {
    return <Empty message="No feed records yet." />;
  }

  // Accumulate kg and cost by month-label
  const byDate = new Map<string, { kg: number; cost: number }>();
  for (const r of records) {
    const label = new Date(r.date).toLocaleDateString("en", { month: "short", day: "numeric" });
    const existing = byDate.get(label) ?? { kg: 0, cost: 0 };
    byDate.set(label, {
      kg: existing.kg + r.quantityKg,
      cost: existing.cost + r.quantityKg * r.costPerKg,
    });
  }

  const data = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    kg: parseFloat(v.kg.toFixed(1)),
    cost: parseFloat(v.cost.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis unit=" kg" tick={{ fontSize: 12 }} width={56} />
        <Tooltip
          formatter={(v, name) =>
            name === "kg" ? [`${Number(v)} kg`, "Quantity"] : [`$${Number(v)}`, "Cost"]
          }
        />
        <Bar dataKey="kg" fill="#86efac" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  );
}
