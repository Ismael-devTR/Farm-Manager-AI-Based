"use client";

import { useState } from "react";
import { simulateSale } from "@/lib/calculations";

const trafficLightStyles = {
  green: {
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
    text: "text-green-800",
    label: "Profitable",
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-400",
    text: "text-yellow-800",
    label: "Break-even zone",
  },
  red: {
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    text: "text-red-800",
    label: "Loss",
  },
};

type Props = {
  totalCost: number;
  animalCount: number;
  avgCurrentWeight: number | null;
};

export default function SalePriceSimulator({ totalCost, animalCount, avgCurrentWeight }: Props) {
  const [meatPrice, setMeatPrice] = useState("");
  const [sellingWeight, setSellingWeight] = useState(
    avgCurrentWeight ? String(avgCurrentWeight.toFixed(1)) : ""
  );
  const [carcassYield, setCarcassYield] = useState("75");

  const mp = parseFloat(meatPrice);
  const sw = parseFloat(sellingWeight);
  const cy = parseFloat(carcassYield);

  const result =
    mp > 0 && sw > 0 && cy > 0 && cy <= 100
      ? simulateSale(totalCost, {
          meatPricePerKg: mp,
          avgSellingWeight: sw,
          carcassYield: cy,
          animalCount,
        })
      : null;

  const styles = result ? trafficLightStyles[result.trafficLight] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Meat price ($/kg)
          </label>
          <input
            type="number"
            value={meatPrice}
            onChange={(e) => setMeatPrice(e.target.value)}
            step="0.01"
            min="0"
            placeholder="e.g. 2.80"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Avg selling weight (kg/animal)
          </label>
          <input
            type="number"
            value={sellingWeight}
            onChange={(e) => setSellingWeight(e.target.value)}
            step="0.1"
            min="0"
            placeholder="e.g. 110"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Carcass yield (%)
          </label>
          <input
            type="number"
            value={carcassYield}
            onChange={(e) => setCarcassYield(e.target.value)}
            step="0.1"
            min="1"
            max="100"
            placeholder="e.g. 75"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {result && styles && (
        <div className={`rounded-xl border p-5 ${styles.bg}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${styles.dot}`} />
            <span className={`font-semibold text-sm ${styles.text}`}>{styles.label}</span>
            <span className={`text-sm ${styles.text}`}>
              — {result.profitMargin > 0 ? "+" : ""}{result.profitMargin.toFixed(1)}% margin
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-lg font-bold text-gray-900">${result.revenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total cost</p>
              <p className="text-lg font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {result.profit >= 0 ? "Profit" : "Loss"}
              </p>
              <p className={`text-lg font-bold ${result.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                {result.profit >= 0 ? "+" : ""}${result.profit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <p className="text-xs text-gray-400">Fill in all fields to see the simulation.</p>
      )}
    </div>
  );
}
