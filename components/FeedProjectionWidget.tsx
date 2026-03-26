"use client";

import { useState } from "react";
import { computeFeedProjection, type FeedProjectionInputs } from "@/lib/calculations";
import { useDict } from "@/components/LocaleProvider";
import FeedProjectionChart from "@/components/charts/FeedProjectionChart";

type Props = Omit<FeedProjectionInputs, "targetAvgWeight">;

export default function FeedProjectionWidget(props: Props) {
  const dict = useDict();
  const t = dict.feedProjection;
  const [targetInput, setTargetInput] = useState("");

  const targetAvgWeight = parseFloat(targetInput);
  const hasTarget = !isNaN(targetAvgWeight) && targetAvgWeight > 0;

  const proj = hasTarget
    ? computeFeedProjection({ ...props, targetAvgWeight })
    : null;

  const cls =
    "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 w-36";

  return (
    <div className="space-y-4">
      {/* Current rate */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard
          label={t.dailyRate}
          value={
            props.feedRecords.length > 0
              ? `${computeFeedProjection({ ...props, targetAvgWeight: 0 }).avgDailyKg?.toFixed(1)} kg/día`
              : "—"
          }
        />
        <MiniCard
          label={t.avgCostPerKg}
          value={
            props.feedRecords.length > 0
              ? `$${computeFeedProjection({ ...props, targetAvgWeight: 0 }).avgCostPerKg?.toFixed(3)}`
              : "—"
          }
        />
      </div>

      {/* Target input */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.targetWeight}
          </label>
          <input
            type="number"
            min="1"
            step="0.5"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={t.targetWeightPlaceholder}
            className={cls}
          />
        </div>
      </div>

      {/* Projection results */}
      {proj && hasTarget && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <MiniCard
            label={t.remainingFeed}
            value={proj.remainingFeedKg != null ? `${proj.remainingFeedKg.toFixed(0)} kg` : "—"}
          />
          <MiniCard
            label={t.totalFeedNeeded}
            value={proj.projectedTotalFeedKg != null ? `${proj.projectedTotalFeedKg.toFixed(0)} kg` : "—"}
          />
          <MiniCard
            label={t.daysRemaining}
            value={proj.daysRemaining != null ? `${Math.ceil(proj.daysRemaining)} días` : "—"}
          />
          <MiniCard
            label={t.estimatedFinish}
            value={proj.estimatedFinishDate != null ? proj.estimatedFinishDate.toLocaleDateString() : "—"}
          />
          <MiniCard
            label={t.remainingCost}
            value={proj.projectedRemainingCost != null ? `$${proj.projectedRemainingCost.toFixed(2)}` : "—"}
            wide
          />
        </div>
      )}

      {!hasTarget && (
        <p className="text-xs text-gray-400">{t.fillTarget}</p>
      )}

      {/* Chart — shown as soon as there are feed records, projection overlay added once target is set */}
      {props.feedRecords.length > 0 && proj?.avgDailyKg && proj.estimatedFinishDate && (
        <FeedProjectionChart
          feedRecords={props.feedRecords}
          avgDailyKg={proj.avgDailyKg}
          totalFeedConsumed={props.feedRecords.reduce((s, r) => s + r.quantityKg, 0)}
          projectedTotalFeedKg={proj.projectedTotalFeedKg ?? 0}
          estimatedFinishDate={proj.estimatedFinishDate}
        />
      )}
    </div>
  );
}

function MiniCard({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 p-3 ${wide ? "col-span-2 sm:col-span-2" : ""}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
