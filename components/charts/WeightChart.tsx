"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  records: { weekNumber: number; totalWeight: number; animalCount: number }[];
};

export default function WeightChart({ records }: Props) {
  if (records.length === 0) {
    return <Empty message="No weight records yet." />;
  }

  const data = records.map((r) => ({
    week: `W${r.weekNumber}`,
    avg: parseFloat((r.totalWeight / r.animalCount).toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis unit=" kg" tick={{ fontSize: 12 }} width={56} />
        <Tooltip formatter={(v) => [`${Number(v)} kg`, "Avg weight"]} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 4, fill: "#16a34a" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
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
