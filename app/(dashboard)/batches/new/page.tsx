"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBatch } from "@/lib/actions/batch";
import { useDict } from "@/components/LocaleProvider";

export default function NewBatchPage() {
  const dict = useDict();
  const t = dict.batchForm;
  const router = useRouter();
  const [state, action, pending] = useActionState(createBatch, {});

  useEffect(() => {
    if (state.batchId) router.push(`/batches/${state.batchId}`);
  }, [state.batchId, router]);
  const today = new Date().toISOString().split("T")[0];

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">{dict.common.back}</Link>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
      </div>

      <form action={action} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <Field label={t.name} cls={cls} name="name" required placeholder={t.namePlaceholder} />
        <Field label={t.entryDate} cls={cls} name="entryDate" type="date" required defaultValue={today} />
        <Field label={t.animalCount} cls={cls} name="animalCount" type="number" required min="1" placeholder={t.animalCountPlaceholder} />
        <Field label={t.birthWeeks} cls={cls} name="birthWeeks" type="number" required min="1" placeholder={t.birthWeeksPlaceholder} />
        <Field label={t.initialWeight} cls={cls} name="initialWeight" type="number" required step="0.1" min="0.1" placeholder={t.initialWeightPlaceholder} />
        <Field label={t.costPerAnimal} cls={cls} name="costPerAnimal" type="number" required step="0.01" min="0" placeholder={t.costPerAnimalPlaceholder} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
          <textarea name="notes" rows={3} placeholder={dict.common.optional}
            className={cls + " resize-none"} />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={pending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
            {pending ? t.creating : t.create}
          </button>
          <Link href="/batches" className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2 rounded-lg text-sm border border-gray-300 transition-colors">
            {dict.common.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, cls, name, type = "text", required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; cls: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input name={name} type={type} required={required} className={cls} {...props} />
    </div>
  );
}
