"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { updateBatch } from "@/lib/actions/batch";
import { useDict } from "@/components/LocaleProvider";
import EditModal from "@/components/EditModal";

type BatchEditData = {
  id: string;
  name: string;
  entryDate: string;
  animalCount: number;
  birthWeeks: number;
  initialWeight: number;
  costPerAnimal: number;
  notes?: string | null;
};

type Props = {
  data: BatchEditData;
  className?: string;
};

export default function EditBatchButton({ data, className }: Props) {
  const dict = useDict();
  const t = dict.batchForm;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const action = updateBatch.bind(null, data.id);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.success) close();
  }, [state?.success, close]);

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"}
      >
        {dict.common.edit}
      </button>

      <EditModal open={open} onClose={close} title={t.title}>
        <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.name} *</label>
            <input name="name" type="text" required defaultValue={data.name} placeholder={t.namePlaceholder} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.entryDate} *</label>
            <input name="entryDate" type="date" required defaultValue={data.entryDate} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.animalCount} *</label>
            <input name="animalCount" type="number" required min="1" defaultValue={data.animalCount} placeholder={t.animalCountPlaceholder} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.birthWeeks} *</label>
            <input name="birthWeeks" type="number" required min="1" defaultValue={data.birthWeeks} placeholder={t.birthWeeksPlaceholder} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.initialWeight} *</label>
            <input name="initialWeight" type="number" required step="0.1" min="0" defaultValue={data.initialWeight} placeholder={t.initialWeightPlaceholder} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.costPerAnimal} *</label>
            <input name="costPerAnimal" type="number" required step="0.01" min="0" defaultValue={data.costPerAnimal} placeholder={t.costPerAnimalPlaceholder} className={cls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.notes}</label>
            <input name="notes" type="text" defaultValue={data.notes ?? ""} placeholder={dict.common.optional} className={cls} />
          </div>
          {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending}
            className="col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            {pending ? dict.common.saving : dict.common.save}
          </button>
        </form>
      </EditModal>
    </>
  );
}
