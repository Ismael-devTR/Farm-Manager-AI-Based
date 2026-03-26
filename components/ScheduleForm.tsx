"use client";

import { useActionState } from "react";
import { addSchedule } from "@/lib/actions/schedule";

export default function ScheduleForm({ batchId }: { batchId: string }) {
  const action = addSchedule.bind(null, batchId);
  const [state, formAction, pending] = useActionState(action, {});
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled date *</label>
        <input name="scheduledDate" type="date" required defaultValue={today}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
        <select name="type" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="VACCINE">Vaccine</option>
          <option value="DEWORMER">Dewormer</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
        <input name="product" type="text" required placeholder="e.g. PCV2 Vaccine"
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
        {pending ? "Saving..." : "Add to schedule"}
      </button>
    </form>
  );
}
