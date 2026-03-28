"use client";

import { useActionState, useEffect } from "react";
import { addWeightRecord, updateWeightRecord } from "@/lib/actions/weight";
import { useDict } from "@/components/LocaleProvider";
import { useEditModalClose } from "@/components/EditButton";

export type WeightEditData = {
  id: string;
  recordDate: string;
  weekNumber: number;
  totalWeight: number;
  animalCount: number;
  notes?: string | null;
};

type Props = {
  batchId: string;
  editData?: WeightEditData;
};

export default function WeightForm({ batchId, editData }: Props) {
  const dict = useDict();
  const t = dict.weightForm;
  const closeModal = useEditModalClose();

  const action = editData
    ? updateWeightRecord.bind(null, editData.id, batchId)
    : addWeightRecord.bind(null, batchId);
  const [state, formAction, pending] = useActionState(action, {});
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (state?.success && closeModal) closeModal();
  }, [state?.success, closeModal]);

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.date} *</label>
        <input name="recordDate" type="date" required defaultValue={editData?.recordDate ?? today} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.week} *</label>
        <input name="weekNumber" type="number" required min="1" defaultValue={editData?.weekNumber} placeholder={t.weekPlaceholder} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.totalWeight} *</label>
        <input name="totalWeight" type="number" required step="0.1" min="0" defaultValue={editData?.totalWeight} placeholder={t.totalWeightPlaceholder} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.animalsWeighed} *</label>
        <input name="animalCount" type="number" required min="1" defaultValue={editData?.animalCount} placeholder={t.animalsPlaceholder} className={cls} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">{dict.common.notes}</label>
        <input name="notes" type="text" defaultValue={editData?.notes ?? ""} placeholder={dict.common.optional} className={cls} />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {pending ? dict.common.saving : editData ? dict.common.save : t.add}
      </button>
    </form>
  );
}
