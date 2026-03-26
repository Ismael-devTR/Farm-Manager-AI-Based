"use client";

import { useState } from "react";
import { simulateSale } from "@/lib/calculations";
import { useDict } from "@/components/LocaleProvider";

type Props = {
  totalCost: number;
  animalCount: number;
  avgCurrentWeight: number | null;
};

export default function SalePriceSimulator({ totalCost, animalCount, avgCurrentWeight }: Props) {
  const t = useDict().simulator;
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
      ? simulateSale(totalCost, { meatPricePerKg: mp, avgSellingWeight: sw, carcassYield: cy, animalCount })
      : null;

  const styles = result
    ? {
        green: { bg: "bg-green-50 border-green-200", dot: "bg-green-500", text: "text-green-800", label: t.profitable },
        yellow: { bg: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-400", text: "text-yellow-800", label: t.breakEven },
        red: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-800", label: t.loss },
      }[result.trafficLight]
    : null;

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.meatPrice}</label>
          <input type="number" value={meatPrice} onChange={(e) => setMeatPrice(e.target.value)}
            step="0.01" min="0" placeholder={t.meatPricePlaceholder} className={cls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.sellingWeight}</label>
          <input type="number" value={sellingWeight} onChange={(e) => setSellingWeight(e.target.value)}
            step="0.1" min="0" placeholder={t.sellingWeightPlaceholder} className={cls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.carcassYield}</label>
          <input type="number" value={carcassYield} onChange={(e) => setCarcassYield(e.target.value)}
            step="0.1" min="1" max="100" placeholder={t.carcassYieldPlaceholder} className={cls} />
        </div>
      </div>

      {result && styles && (
        <div className={`rounded-xl border p-5 ${styles.bg}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${styles.dot}`} />
            <span className={`font-semibold text-sm ${styles.text}`}>{styles.label}</span>
            <span className={`text-sm ${styles.text}`}>
              — {result.profitMargin > 0 ? "+" : ""}{result.profitMargin.toFixed(1)}% {t.margin}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">{t.revenue}</p>
              <p className="text-lg font-bold text-gray-900">${result.revenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t.totalCost}</p>
              <p className="text-lg font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{result.profit >= 0 ? t.profit : t.lossLabel}</p>
              <p className={`text-lg font-bold ${result.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                {result.profit >= 0 ? "+" : ""}${result.profit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && <p className="text-xs text-gray-400">{t.fillFields}</p>}
    </div>
  );
}
