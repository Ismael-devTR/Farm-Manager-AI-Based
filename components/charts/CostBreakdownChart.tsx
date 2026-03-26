"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useDict } from "@/components/LocaleProvider";

type Props = {
  animalCost: number;
  feedCost: number;
  expenseCost: number;
};

const COLORS = ["#16a34a", "#86efac", "#fbbf24"];

export default function CostBreakdownChart({ animalCost, feedCost, expenseCost }: Props) {
  const dict = useDict();
  const t = dict.batches;
  const total = animalCost + feedCost + expenseCost;

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        {dict.common.noData}
      </div>
    );
  }

  const data = [
    { name: t.animalsLabel, value: parseFloat(animalCost.toFixed(2)) },
    { name: t.feedLabel, value: parseFloat(feedCost.toFixed(2)) },
    { name: t.expensesLabel, value: parseFloat(expenseCost.toFixed(2)) },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, ""]} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value, entry) => {
            const pct = (((entry.payload as { value: number }).value / total) * 100).toFixed(1);
            return `${value} ${pct}%`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
