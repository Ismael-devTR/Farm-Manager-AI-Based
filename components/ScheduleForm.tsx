"use client";

import { useActionState } from "react";
import { addSchedule } from "@/lib/actions/schedule";
import { useDict } from "@/components/LocaleProvider";

export default function ScheduleForm({ batchId }: { batchId: string }) {
  const dict = useDict();
  const t = dict.scheduleForm;
  const action = addSchedule.bind(null, batchId);
  const [state, formAction, pending] = useActionState(action, {});
  const today = new Date().toISOString().split("T")[0];

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.date} *</label>
        <input name="scheduledDate" type="date" required defaultValue={today} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.type} *</label>
        <select name="type" required className={cls}>
          <option value="VACCINE">{t.vaccine}</option>
          <option value="DEWORMER">{t.dewormer}</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.product} *</label>
        <input name="product" type="text" required placeholder={t.productPlaceholder} className={cls} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">{dict.common.notes}</label>
        <input name="notes" type="text" placeholder={dict.common.optional} className={cls} />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {pending ? dict.common.saving : t.add}
      </button>
    </form>
  );
}
