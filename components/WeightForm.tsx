"use client";

import { useActionState } from "react";
import { addWeightRecord } from "@/lib/actions/weight";

export default function WeightForm({ batchId }: { batchId: string }) {
  const action = addWeightRecord.bind(null, batchId);
  const [state, formAction, pending] = useActionState(action, {});
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
        <input name="recordDate" type="date" required defaultValue={today}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Week number *</label>
        <input name="weekNumber" type="number" required min="1" placeholder="e.g. 4"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Total weight (kg) *</label>
        <input name="totalWeight" type="number" required step="0.1" min="0" placeholder="e.g. 1250"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Animals weighed *</label>
        <input name="animalCount" type="number" required min="1" placeholder="e.g. 50"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <input name="notes" type="text" placeholder="Optional"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {pending ? "Saving..." : "Add weight record"}
      </button>
    </form>
  );
}
